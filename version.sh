#!/bin/bash
./flatedit
md2pdf README.md Proteusz999.pdf
python changelog.py
bash git.sh
