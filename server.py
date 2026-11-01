"""ЦДБ: закрытый рабочий навигатор. Python 3.11+, без внешних зависимостей."""
import argparse
import getpass
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import shutil
import sqlite3
import time
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get('CENTRDB_DATA_DIR', ROOT / 'var')).resolve()
ROLES = ('director', 'administrator', 'manager', 'contractor')
LIMIT = 65536

def db():
    DATA.mkdir(mode=0o700, parents=True, exist_ok=True)
    c = sqlite3.connect(DATA / 'centrdb.sqlite3', timeout=10)
    c.row_factory = sqlite3.Row
    c.executescript('''
    CREATE TABLE IF NOT EXISTS users(login TEXT PRIMARY KEY, password TEXT NOT NULL, role TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, login TEXT, csrf TEXT, expires INTEGER);
    CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, login TEXT, title TEXT, status TEXT, updated INTEGER);
    CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY, count INTEGER, reset INTEGER);
    ''')
    return c

def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 600000).hex()
    return salt + ':' + digest

def authenticate(login, password):
    with db() as c:
        row = c.execute('SELECT * FROM users WHERE login=?', (login,)).fetchone()
    stored = row['password'] if row else '0'*32 + ':' + '0'*64
    return row if hmac.compare_digest(password_hash(password, stored.split(':')[0]), stored) else None

def session_key(token):
    return hashlib.sha256(token.encode()).hexdigest()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Не записываем пароли, тела запросов и cookies.
        super().log_message(fmt, *args)

    def reply(self, code, body, kind='application/json; charset=utf-8', cookie=None):
        if not isinstance(body, bytes):
            body = (json.dumps(body, ensure_ascii=False) if not isinstance(body, str) else body).encode()
        self.send_response(code)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        if self.path == '/api/report':
            self.send_header('Content-Security-Policy', "sandbox allow-scripts; frame-ancestors 'self'")
        else:
            self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(body)

    def session(self):
        try:
            cookie = SimpleCookie(self.headers.get('Cookie', ''))
            token = cookie['sid'].value
        except (KeyError, ValueError):
            return None
        with db() as c:
            return c.execute('''SELECT u.login,u.role,s.csrf FROM sessions s JOIN users u ON u.login=s.login
                WHERE token=? AND expires>?''', (session_key(token), int(time.time()))).fetchone()

    def do_GET(self):
        assets = {'/': ('index.html', 'text/html; charset=utf-8'), '/app.js': ('app.js', 'text/javascript; charset=utf-8'), '/style.css': ('style.css', 'text/css; charset=utf-8')}
        if self.path in assets:
            file, kind = assets[self.path]
            return self.reply(200, (ROOT / file).read_bytes(), kind)
        user = self.session()
        if not user:
            return self.reply(401, {'error': 'Требуется вход'})
        if self.path == '/api/me':
            return self.reply(200, dict(user))
        if self.path == '/api/academy':
            modules = json.loads((ROOT / 'academy.json').read_text())
            return self.reply(200, [m for m in modules if user['role'] in m['roles']])
        if self.path == '/api/tasks':
            with db() as c:
                rows = c.execute('SELECT id,title,status,updated FROM tasks WHERE login=? ORDER BY id DESC', (user['login'],)).fetchall()
            return self.reply(200, [dict(r) for r in rows])
        if self.path == '/api/report':
            if user['role'] != 'director':
                return self.reply(403, {'error': 'Раздел доступен руководителю'})
            file = DATA / 'report.html'
            if not file.exists():
                return self.reply(404, 'Отчёт ещё не импортирован. На сервере: python3 server.py import-report /путь/к/отчёту.html', 'text/plain; charset=utf-8')
            return self.reply(200, file.read_bytes(), 'text/html; charset=utf-8')
        self.reply(404, {'error': 'Не найдено'})

    def do_POST(self):
        origin = self.headers.get('Origin')
        allowed = os.environ.get('CENTRDB_ORIGIN', 'http://' + self.headers.get('Host', ''))
        if origin and origin != allowed:
            return self.reply(403, {'error': 'Недопустимый источник запроса'})
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if size < 0 or size > LIMIT:
                return self.reply(413, {'error': 'Запрос слишком большой'})
            body = json.loads(self.rfile.read(size))
            if not isinstance(body, dict):
                raise ValueError()
        except (ValueError, UnicodeError):
            return self.reply(400, {'error': 'Некорректный JSON'})
        if self.path == '/api/login':
            login, password = body.get('login'), body.get('password')
            if not isinstance(login, str) or not isinstance(password, str) or len(login) > 100 or len(password) > 1024:
                return self.reply(400, {'error': 'Некорректные данные входа'})
            now = int(time.time())
            # Ограничение по адресу соединения. Прокси должен дополнительно ограничивать /api/login.
            key = self.client_address[0]
            with db() as c:
                c.execute('DELETE FROM attempts WHERE reset<?', (now,))
                c.execute('DELETE FROM sessions WHERE expires<?', (now,))
                attempt = c.execute('SELECT count FROM attempts WHERE key=?', (key,)).fetchone()
                if attempt and attempt['count'] >= 15:
                    return self.reply(429, {'error': 'Слишком много попыток. Повторите через 15 минут'})
                c.execute('INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1', (key, now+900))
            user = authenticate(login, password)
            if not user:
                return self.reply(401, {'error': 'Неверный логин или пароль'})
            token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
            with db() as c:
                c.execute('DELETE FROM attempts WHERE key=?', (key,))
                c.execute('INSERT INTO sessions VALUES(?,?,?,?)', (session_key(token), login, csrf, now+28800))
            secure = '; Secure' if os.environ.get('CENTRDB_SECURE_COOKIE') == '1' else ''
            return self.reply(200, {'login': login, 'role': user['role'], 'csrf': csrf}, cookie='sid='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800'+secure)
        user = self.session()
        if not user:
            return self.reply(401, {'error': 'Требуется вход'})
        if not hmac.compare_digest(self.headers.get('X-CSRF-Token', ''), user['csrf']):
            return self.reply(403, {'error': 'Недействительный токен запроса'})
        if self.path == '/api/logout':
            cookie = SimpleCookie(self.headers.get('Cookie', ''))
            with db() as c:
                c.execute('DELETE FROM sessions WHERE token=?', (session_key(cookie['sid'].value),))
            return self.reply(200, {'ok': True}, cookie='sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
        if self.path == '/api/tasks':
            title = body.get('title', '')
            status = body.get('status', 'planned')
            task_id = body.get('id')
            if not isinstance(title, str) or not title.strip() or len(title) > 300 or status not in ('planned','doing','done') or (task_id is not None and type(task_id) is not int):
                return self.reply(400, {'error': 'Проверьте название и статус'})
            with db() as c:
                if task_id is None:
                    c.execute('INSERT INTO tasks(login,title,status,updated) VALUES(?,?,?,?)', (user['login'], title.strip(), status, int(time.time())))
                else:
                    cur = c.execute('UPDATE tasks SET title=?,status=?,updated=? WHERE id=? AND login=?', (title.strip(),status,int(time.time()),task_id,user['login']))
                    if not cur.rowcount:
                        return self.reply(404, {'error': 'Задача не найдена'})
            return self.reply(200, {'ok': True})
        self.reply(404, {'error': 'Не найдено'})

def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest='command', required=True)
    serve = sub.add_parser('serve'); serve.add_argument('--port', type=int, default=8080)
    user = sub.add_parser('user'); user.add_argument('login'); user.add_argument('role', choices=ROLES)
    imp = sub.add_parser('import-report'); imp.add_argument('file', type=Path)
    backup = sub.add_parser('backup'); backup.add_argument('file', type=Path)
    args = p.parse_args()
    os.umask(0o077)
    with db():
        pass
    if args.command == 'user':
        password = getpass.getpass('Пароль (от 12 символов): ')
        if len(password) < 12 or len(password) > 1024:
            p.error('Пароль должен содержать 12–1024 символа')
        with db() as c:
            c.execute('INSERT INTO users VALUES(?,?,?) ON CONFLICT(login) DO UPDATE SET password=excluded.password,role=excluded.role', (args.login,password_hash(password),args.role))
            c.execute('DELETE FROM sessions WHERE login=?', (args.login,))
        print('Пользователь сохранён; прежние сеансы завершены.')
    elif args.command == 'import-report':
        source = args.file.resolve()
        if not source.is_file() or source.stat().st_size > 10000000:
            p.error('Нужен существующий HTML-файл до 10 МБ')
        source.read_text(encoding='utf-8')
        shutil.copyfile(source, DATA / 'report.html')
        print('Отчёт импортирован. Доступ: director.')
    elif args.command == 'backup':
        with db() as c, sqlite3.connect(args.file) as target:
            c.backup(target)
        print('Резервная копия базы создана. Отчёт копируется отдельно.')
    else:
        print('ЦДБ: http://127.0.0.1:'+str(args.port))
        ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()

if __name__ == '__main__':
    main()
