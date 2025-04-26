#!/bin/bash
./flatedit
cp README.md Proteusz999.md
# Usuń 3 pierwsze linijki i zapisz do pliku tymczasowego
# Utwórz tymczasowy plik
temp_file=$(mktemp)
# Usuń 3 pierwsze linijki i zapisz do pliku tymczasowego
tail -n +4 "Proteusz999.md" > "$temp_file"
# Zastąp oryginalny plik plikiem tymczasowym
mv "$temp_file" "Proteusz999.md"
#md2pdf Proteusz999.md Proteusz999.pdf
md2pdf README.md Proteusz999.pdf --css-file=md2pdf/style.css --mermaid-options='{"theme":"neutral","securityLevel":"loose"}'
python changelog.py
bash git.sh
