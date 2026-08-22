import zipfile
import re
import sys
import os

docx_path = r"c:\Users\PC\Resilio Sync\geoportal (1)\Slorse\fotos_quellouno.docx"

if not os.path.exists(docx_path):
    print(f"Error: File not found at {docx_path}")
    sys.exit(1)

try:
    with zipfile.ZipFile(docx_path) as z:
        # Read the document structure
        xml_content = z.read('word/document.xml').decode('utf-8')
        
        # Simple regex to find text content (this is very rough)
        # We are looking for patterns like "Km", "Progresiva", "Foto", numbers like "0+000"
        text_matches = re.findall(r'<w:t[^>]*>(.*?)</w:t>', xml_content)
        full_text = " ".join(text_matches)
        
        print("--- EXTRACTED TEXT SAMPLE (First 500 chars) ---")
        print(full_text[:500])
        print("\n--- POSSIBLE PROGRESIVA PATTERNS FOUND ---")
        # Look for patterns like 10+500, 10 + 500, 10+500.00
        prog_pattern = re.compile(r'\d+\s*\+\s*\d{3}')
        found = prog_pattern.findall(full_text)
        print(found[:20]) # Limit to 20
        
        print("\n--- IMAGES FOUND IN ARCHIVE ---")
        # Images are usually in word/media/
        images = [f for f in z.namelist() if f.startswith('word/media/')]
        print(f"Total images found: {len(images)}")
        if len(images) > 0:
            print(f"Sample: {images[:5]}")
            
except Exception as e:
    print(f"Error analyzing docx: {e}")
