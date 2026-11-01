import importlib.util
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

spec = importlib.util.spec_from_file_location('server', Path(__file__).resolve().parents[1] / 'server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)

class AccessTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        server.DATA = Path(cls.tmp.name)
        with server.db() as c:
            for role in server.ROLES:
                c.execute('INSERT INTO users VALUES(?,?,?)', (role, server.password_hash('a-strong-test-password'),role))
        (server.DATA / 'report.html').write_text('<h1>Private report</h1>')
        cls.start_server()

    @classmethod
    def start_server(cls):
        cls.http = server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        cls.url='http://127.0.0.1:'+str(cls.http.server_port)
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();cls.tmp.cleanup()

    def req(self,path,data=None,cookie=None,csrf=None,origin=None):
        headers={}
        if cookie: headers['Cookie']=cookie
        if csrf: headers['X-CSRF-Token']=csrf
        if origin: headers['Origin']=origin
        if data is not None: headers['Content-Type']='application/json'
        request=urllib.request.Request(self.url+path,None if data is None else json.dumps(data).encode(),headers)
        try: res=urllib.request.urlopen(request)
        except urllib.error.HTTPError as e: res=e
        return res.status,res.read(),res.headers

    def login(self,role):
        status,body,headers=self.req('/api/login',{'login':role,'password':'a-strong-test-password'})
        self.assertEqual(status,200)
        return headers['Set-Cookie'].split(';')[0],json.loads(body)['csrf']

    def test_report_roles(self):
        self.assertEqual(self.req('/api/report')[0],401)
        for role in server.ROLES:
            cookie,_=self.login(role)
            self.assertEqual(self.req('/api/report',cookie=cookie)[0],200 if role=='director' else 403)
            status,body,_=self.req('/api/academy',cookie=cookie)
            modules=json.loads(body)
            self.assertTrue(all(role in m['roles'] for m in modules))
            if role=='contractor': self.assertEqual(len(modules),1)

    def test_task_isolation_and_persistence(self):
        cookie,csrf=self.login('manager')
        self.assertEqual(self.req('/api/tasks',{'title':'Check schedule'},cookie)[0],403)
        self.assertEqual(self.req('/api/tasks',{'title':'Check schedule'},cookie,csrf, 'https://evil.example')[0],403)
        self.assertEqual(self.req('/api/tasks',{'title':'Check schedule'},cookie,csrf)[0],200)
        rows=json.loads(self.req('/api/tasks',cookie=cookie)[1]);task=rows[0]
        other,othercsrf=self.login('contractor')
        self.assertEqual(json.loads(self.req('/api/tasks',cookie=other)[1]),[])
        self.assertEqual(self.req('/api/tasks',dict(task,status='done'),other,othercsrf)[0],404)
        self.http.shutdown();self.http.server_close();self.start_server()
        self.assertEqual(json.loads(self.req('/api/tasks',cookie=cookie)[1])[0]['title'],'Check schedule')
        self.assertEqual(self.req('/api/logout',{},cookie,csrf)[0],200)
        self.assertEqual(self.req('/api/tasks',cookie=cookie)[0],401)

    def test_login_and_paths(self):
        self.assertEqual(self.req('/api/login',{'login':'director','password':'wrong'})[0],401)
        cookie,_=self.login('director')
        for path in ['/var/centrdb.sqlite3','/server.py','/../var/report.html']:
            self.assertEqual(self.req(path,cookie=cookie)[0],404)
        self.assertEqual(self.req('/')[0],200)

if __name__=='__main__': unittest.main()
