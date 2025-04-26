#!/bin/bash
./flatedit
cp README.md Proteusz999.md
md2pdf Proteusz999.md Proteusz999.pdf
python changelog.py
bash git.sh
