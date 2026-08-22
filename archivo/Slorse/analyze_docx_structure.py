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
        # 1. Map r:id to filename
        rels_xml = z.read('word/_rels/document.xml.rels')
        rels_tree = ET.fromstring(rels_xml)
        rid_map = {}
        # Rel namespace is usually default or specific package
        for rel in rels_tree.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            rid = rel.attrib.get('Id')
            target = rel.attrib.get('Target')
            rid_map[rid] = target

        # 2. Parse document content
        doc_xml = z.read('word/document.xml')
        doc_tree = ET.fromstring(doc_xml)
        
        print("--- CONTENT ANALYSIS SEQUENCE ---")
        
        def get_text(node):
            texts = []
            for t in node.findall('.//w:t', ns):
                if t.text:
                    texts.append(t.text)
            return "".join(texts)

        def get_images(node):
            imgs = []
            # blip usually in a:blip with r:embed
            for blip in node.findall('.//a:blip', ns):
                embed_id = blip.attrib.get(f"{{{ns['r']}}}embed")
                if embed_id and embed_id in rid_map:
                    imgs.append(rid_map[embed_id])
            return imgs
            
        body = doc_tree.find('w:body', ns)
        
        # Iterate over paragraphs and tables loosely
        # In a docx, body has children like w:p (paragraph) and w:tbl (table)
        
        item_count = 0
        for child in body:
            tag_name = child.tag.split('}')[-1] # remove ns for display
            
            text_content = get_text(child).strip()
            image_refs = get_images(child)
            
            if text_content or image_refs:
                print(f"[{tag_name}]")
                if text_content:
                    # Check if it looks like a progresiva
                    is_prog = re.search(r'\d+\s*\+\s*\d{3}', text_content)
                    prefix = ">>> PROGRESIVA CAUGHT: " if is_prog else "Text: "
                    print(f"  {prefix}{text_content[:100]}...") # truncate
                    
                if image_refs:
                    print(f"  Images ({len(image_refs)}): {image_refs}")
                
                item_count += 1
                if item_count > 50: # Limit output
                    print("... (Stopping analysis after 50 items)")
                    break

except Exception as e:
    print(f"Error detailed analysis: {e}")
    import traceback
    traceback.print_exc()
