import zipfile
import xml.etree.ElementTree as ET
import re
import sys
import os

docx_path = r"c:\Users\PC\Resilio Sync\geoportal (1)\Slorse\fotos_quellouno.docx"

if not os.path.exists(docx_path):
    print(f"Error: File not found at {docx_path}")
    sys.exit(1)

ns = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
}

try:
    with zipfile.ZipFile(docx_path) as z:
        rels_xml = z.read('word/_rels/document.xml.rels')
        rels_tree = ET.fromstring(rels_xml)
        rid_map = {}
        for rel in rels_tree.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            rid = rel.attrib.get('Id')
            target = rel.attrib.get('Target')
            rid_map[rid] = target

        doc_xml = z.read('word/document.xml')
        doc_tree = ET.fromstring(doc_xml)
        
        def get_text(node):
            texts = []
            for t in node.findall('.//w:t', ns):
                if t.text: texts.append(t.text)
            return "".join(texts)

        def get_images(node):
            imgs = []
            for blip in node.findall('.//a:blip', ns):
                embed_id = blip.attrib.get(f"{{{ns['r']}}}embed")
                if embed_id and embed_id in rid_map: imgs.append(rid_map[embed_id])
            return imgs
            
        body = doc_tree.find('w:body', ns)
        
        print("--- TABLE STRUCTURE ANALYSIS ---")
        
        tables = body.findall('w:tbl', ns)
        print(f"Found {len(tables)} tables.")
        
        for t_idx, tbl in enumerate(tables):
            print(f"Table {t_idx+1}:")
            rows = tbl.findall('w:tr', ns)
            print(f"  Rows: {len(rows)}")
            
            for r_idx, row in enumerate(rows[:5]): # Check first 5 rows
                cells = row.findall('w:tc', ns)
                print(f"  Row {r_idx+1} (Cells: {len(cells)}):")
                for c_idx, cell in enumerate(cells):
                    txt = get_text(cell).strip()
                    imgs = get_images(cell)
                    
                    # Clean text
                    txt_short = (txt[:50] + '...') if len(txt) > 50 else txt
                    
                    prog_match = re.search(r'\d+\s*\+\s*\d{3}', txt)
                    prog_str = f" [PROG: {prog_match.group(0)}]" if prog_match else ""
                    
                    if txt or imgs:
                        print(f"    Cell {c_idx+1}: {prog_str}")
                        if txt: print(f"      Txt: {txt_short}")
                        if imgs: print(f"      Imgs: {imgs}")

except Exception as e:
    print(f"Error: {e}")
