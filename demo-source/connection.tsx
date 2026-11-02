import {useEffect} from 'react';import Workspace from './demo-workspace';
export default function Connection(){useEffect(()=>{sessionStorage.removeItem('centrdb-github-session-v1')},[]);return <Workspace user="Сотрудник"/>;}
