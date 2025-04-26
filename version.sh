#!/bin/bash
./flatedit
cp README.md Proteusz999.md
#md2pdf Proteusz999.md Proteusz999.pdf
md2pdf README.md Proteusz999.pdf --css-file=md2pdf/style.css --mermaid-options='{"theme":"neutral","securityLevel":"loose"}'
python changelog.py
bash git.sh
