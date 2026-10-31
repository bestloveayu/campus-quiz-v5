$runtime='C:\Users\bestl\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if(-not(Test-Path -LiteralPath $runtime)){$runtime='python'}
Set-Location -LiteralPath $PSScriptRoot
& $runtime server.py
