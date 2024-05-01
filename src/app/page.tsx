'use client';
import { Command } from '@tauri-apps/api/shell'
import { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs'
import YAML from 'yaml'
import './page.module.css'
import regionList from '../utils/regions.json'
import { ListAccountAliasesCommand, CreateAccountAliasCommand, IAMClient } from "@aws-sdk/client-iam";

export default function Home() {
  const [accountId, setAccountId] = useState('')
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [result, setResult] = useState('')
  const [bombStatus, setBombStatus] = useState('ready') // ready, pending, success, failed
  const [regions, setRegions] = useState([""])
  const [configPath, setConfigPath] = useState("")
  const [credentialsPath, setCredentialsPath] = useState("")

  useEffect(()=>{
    const preSetting = async () => {
      const path = await import('@tauri-apps/api/path');
      const configPathResponse = await path.resolveResource('external/config.yaml')
      if (configPathResponse) setConfigPath(configPathResponse)
      const credentialsPathResponse = await path.resolveResource('external/credentials.json')
      if (credentialsPathResponse) setCredentialsPath(credentialsPathResponse)
      const config = YAML.parse(await readTextFile(configPathResponse))
      const account = JSON.parse(await readTextFile(credentialsPathResponse))
      if (configPathResponse && config) setAccountId(Object.keys(config.accounts)[0])
      if (credentialsPathResponse && account) {
        setAccessKeyId(account.aws_access_key_id)
        setSecretAccessKey(account.aws_secret_access_key)
        setRegions(config.regions)
      }
    }
    preSetting()
  },[])

  const regionHandler = async (box: any) => {
    let tempArray: string[] = []
    tempArray = tempArray.concat(regions)
    if (tempArray.indexOf(box.name) >= 0) {
      tempArray.splice(tempArray.indexOf(box.name), 1)
    } else {
      tempArray.push(box.name)
    }
    console.log(tempArray)
    setRegions(tempArray)
  }

  const setting = async () => {
    let configText = 'regions:\n'
    regions.forEach((region) => { configText += `- "${region}"\n` })
    configText += `account-blocklist:\n- "999999999999"\naccounts:\n  "${accountId}": {}\n`
    const credentialsText = `{\n\t"aws_access_key_id": "${accessKeyId}",\n\t"aws_secret_access_key": "${secretAccessKey}"\n}`
    const configWrite = await writeTextFile(configPath, configText)
    const credentialWrite = await writeTextFile(credentialsPath, credentialsText)
    alert("SAVED");
  }

  const cmd = async () => {
      setBombStatus('pending')

      const iam = new IAMClient({
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey
        },
        region: 'us-east-1', // region
      });
      const listAccountAliasesCommand = new ListAccountAliasesCommand({ MaxItems: 5 });
      const aliases = await iam.send(listAccountAliasesCommand);
      if (aliases.AccountAliases?.length == 0) {
        const createAccountAliasCommand = new CreateAccountAliasCommand({
          AccountAlias: Math.random().toString(36).slice(2),
        });
        await iam.send(createAccountAliasCommand);
      }

      const path = await import('@tauri-apps/api/path');
      const resourcePath = await path.resolveResource('external/config.yaml')
      const command = Command.sidecar('external/aws-nuke', [
        '--config',
        resourcePath,
        '--no-dry-run',
        '--force',
        '--force-sleep',
        '3',
        '--access-key-id',
        accessKeyId,
        '--secret-access-key',
        secretAccessKey,
      ])
      const output = await command.execute()
      if (output.stdout) {
        setResult(output.stdout)
        setBombStatus('ready')
        alert('SUCCESS!')
      }
      return output
  }

  return (
    <div>
        <h3>⚙️ SETTINGS</h3>
        <div>
          Account-ID : <input onChange={(e)=>{setAccountId(e.target.value)}} value={accountId} />
        </div>
        <div>
          AWS-ACCESS-KEY-ID : <input onChange={(e)=>{setAccessKeyId(e.target.value)}} value={accessKeyId} />
        </div>
        <div>
          AWS-SECRET-ACCESS-KEY : <input onChange={(e)=>{setSecretAccessKey(e.target.value)}} value={secretAccessKey} />
        </div>
        <fieldset>
          <legend>리소스를 삭제할 리전을 선택해주세요</legend>
          {
            regionList.data.map((region: string)=>{
              return (
                <div key={region}>
                  <input type="checkbox" id={region} name={region} onClick={(e)=>regionHandler(e.target)} defaultChecked={regions.includes(region)} />
                  <label htmlFor={region}>{region}</label>
                </div>              
              )
            })
          }
        </fieldset>
        <button onClick={setting}>SAVE</button>
        <h3>💣 BOMB</h3>
        {
          bombStatus == 'ready' 
          ? <>
              <button onClick={cmd}>DELETE YOUR RESOURCES</button>
            </>
          : <div>💥 BOMB IS ACTIVE. PLEASE WAIT 💥</div>
        }
        <h3>📜 LOGS</h3>
        {
          result
          ? <div style={{width:"700px"}}>
              <SyntaxHighlighter className="logs" wrapLines={true} wrapLongLines={true} language="bash" style={docco}>{result}</SyntaxHighlighter>
            </div>
          : ''
        }
    </div>
  )
}
