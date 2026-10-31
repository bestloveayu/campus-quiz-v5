import argparse
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import io,json,zipfile,xml.etree.ElementTree as ET
ROOT=Path(__file__).parent
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.js':'text/javascript'}
    def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
    def end_headers(self):
        self.send_header("Cache-Control","no-store")
        super().end_headers()
    def do_POST(self):
        try:
            origin=self.headers.get('Origin','')
            port=self.server.server_port
            if origin and origin not in (f'http://127.0.0.1:{port}',f'http://localhost:{port}'):raise ValueError('不允許的來源')
            size=int(self.headers.get('Content-Length','0'))
            if size<=0 or size>15*1024*1024:raise ValueError('檔案須小於 15 MB')
            data=self.rfile.read(size)
            if self.path=='/extract/docx':
                with zipfile.ZipFile(io.BytesIO(data)) as z:
                    info=z.getinfo('word/document.xml')
                    if info.file_size>20*1024*1024:raise ValueError('文件解壓縮後過大')
                    root=ET.fromstring(z.read(info));ns='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
                    text='\n'.join(''.join(t.text or '' for t in p.iter(ns+'t')) for p in root.iter(ns+'p'))
            elif self.path=='/extract/pdf':
                from pypdf import PdfReader
                doc=PdfReader(io.BytesIO(data))
                if len(doc.pages)>150:raise ValueError('PDF 上限為 150 頁')
                text='\n'.join(p.extract_text() or '' for p in doc.pages)
                if not text.strip():raise ValueError('此 PDF 沒有可讀文字，掃描文件需先 OCR。')
            else:raise ValueError('不支援的格式')
            self.reply(200,{'text':text})
        except Exception as e:self.reply(400,{'error':str(e)})
    def reply(self,status,data):
        self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.end_headers();self.wfile.write(json.dumps(data,ensure_ascii=False).encode())
if __name__=='__main__':
    parser=argparse.ArgumentParser(description='Campus Quiz V5 local server')
    parser.add_argument('--port',type=int,default=3034)
    args=parser.parse_args()
    if not 1<=args.port<=65535:parser.error('port must be between 1 and 65535')
    print(f'Campus Quiz V5 http://127.0.0.1:{args.port}/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
