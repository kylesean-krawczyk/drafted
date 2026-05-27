import zipfile
import xml.etree.ElementTree as ET
import glob
import os
import sys

# Try to find the docx file in various locations
search_patterns = [
    '/tmp/**/*.docx',
    '/tmp/cc-agent/**/*.docx',
    '/home/**/*.docx',
    '/root/**/*.docx',
    '/var/**/*.docx',
    '/uploads/**/*.docx',
]

found_files = []
for pattern in search_patterns:
    files = glob.glob(pattern, recursive=True)
    if files:
        found_files.extend(files)

# Also try a direct find-like walk of /tmp
for root, dirs, filenames in os.walk('/tmp'):
    for f in filenames:
        if f.endswith('.docx'):
            found_files.append(os.path.join(root, f))

# Deduplicate
found_files = list(set(found_files))

if found_files:
    print(f"Found .docx files: {found_files}")
    for docx_path in found_files:
        print(f"\n--- Extracting text from: {docx_path} ---\n")
        try:
            with zipfile.ZipFile(docx_path) as z:
                with z.open('word/document.xml') as f:
                    tree = ET.parse(f)
                    root = tree.getroot()
                    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                    texts = []
                    for t in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                        if t.text:
                            texts.append(t.text)
                    full_text = ''.join(texts)
                    # Try to split into paragraphs by finding paragraph elements
                    paragraphs = []
                    for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                        para_text = ''
                        for t in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                            if t.text:
                                para_text += t.text
                        if para_text.strip():
                            paragraphs.append(para_text)
                    print('\n'.join(paragraphs))
        except Exception as e:
            print(f"Error processing {docx_path}: {e}")
else:
    print("No .docx files found on the filesystem.")
    print("\nSearched locations:")
    for p in search_patterns:
        print(f"  - {p}")
    print("  - os.walk('/tmp')")
    print("\nThe .docx file attachment was not saved to disk in this environment.")
    sys.exit(1)
