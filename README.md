# 💣 AWS Bomb

### 💥 Delete all of your AWS resources with just one click 💥

> [!NOTE]
> Forked from [aws-nuke](https://github.com/rebuy-de/aws-nuke.git)

## Requirements
1. [Node.js v20](https://nodejs.org/en) 
2. Install Rust and Dependencies ([Reference](https://tauri.app/ko/v1/guides/getting-started/prerequisites)).
3. (Windows) Unzip `/src-tauri/external/aws-nuke-x86_64-pc-windows-msvc.zip`
    
    (MacOS) Unzip `/src-tauri/external/aws-nuke-aarch64-apple-darwin.zip`

## Dev Stage
```(shell)
cd aws-bomb-with-gui
npm install
npm run tauri dev
```

## Prod Stage
```(shell)
cd aws-bomb-with-gui
npm install
npm run tauri build
```
Output files will be stored in `/target/release/bundle`

## Troubleshooting
If the commands `npm run tauri dev` or `npm run tauri build` do not work properly, delete `.next`, `out`, and `target` directories from the project root and try again.
