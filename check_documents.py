"""Run against the local V2 server: python check_documents.py."""
import io,json,urllib.request,urllib.error,zipfile
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject,NameObject,DecodedStreamObject
def send(kind,data):
    try:
        res=urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:3034/extract/'+kind,data=data))
        return json.load(res)
    except urllib.error.HTTPError as e:return json.load(e)
z=io.BytesIO()
with zipfile.ZipFile(z,'w') as f:
    f.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DOCX test</w:t></w:r></w:p></w:body></w:document>')
assert send('docx',z.getvalue())['text']=='DOCX test'
b=io.BytesIO();w=PdfWriter();w.add_blank_page(width=100,height=100);w.write(b)
assert 'error' in send('pdf',b.getvalue())
w=PdfWriter();page=w.add_blank_page(width=300,height=300)
font=DictionaryObject({NameObject('/Type'):NameObject('/Font'),NameObject('/Subtype'):NameObject('/Type1'),NameObject('/BaseFont'):NameObject('/Helvetica')})
page[NameObject('/Resources')]=DictionaryObject({NameObject('/Font'):DictionaryObject({NameObject('/F1'):font})})
stream=DecodedStreamObject();stream.set_data(b'BT /F1 12 Tf 20 100 Td (PDF text test) Tj ET')
page[NameObject('/Contents')]=w._add_object(stream)
b=io.BytesIO();w.write(b)
assert 'PDF text test' in send('pdf',b.getvalue())['text']
assert 'error' in send('docx',b'broken')
assert urllib.request.urlopen('http://127.0.0.1:3034/').status==200
print('PASS: HTTP, DOCX text, PDF text, blank PDF rejection, malformed DOCX rejection')
