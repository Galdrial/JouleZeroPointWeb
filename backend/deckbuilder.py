import os
import json
import math
import sys
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

# --- CONFIGURAZIONE PERCORSI ---
BASE_DIR = "/home/simone/Documenti/start2impact/JouleZeroPointDev"
CARDS_FOLDER = os.path.join(BASE_DIR, "frontend/public/assets/cards")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "backend/exports")

# Dimensioni standard TTS
CARD_WIDTH = 744
CARD_HEIGHT = 1039
TTS_COLUMNS = 10

def generate_pdf(deck_data, output_path):
    """Genera un PDF testuale con l'elenco delle carte del mazzo."""
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    y = height - 50
    
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, f"Joule: Zero Point - Decklist: {deck_data.get('name', 'Mazzo Senza Titolo')}")
    y -= 30
    
    c.setFont("Helvetica", 12)
    c.drawString(50, y, f"Creatore: {deck_data.get('creator', 'Anonimo')}")
    y -= 40
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "CARTE NEL MAZZO:")
    y -= 25
    
    c.setFont("Helvetica", 12)
    for card in deck_data.get('cards', []):
        line = f"• {card.get('count', 1)}x {card.get('name', 'Carta Sconosciuta')} ({card.get('type', 'Frammento')})"
        c.drawString(60, y, line)
        y -= 20
        
        if y < 50:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 12)
            
    c.save()
    print(f"✅ PDF Creato: {output_path}")

def generate_tts_jpg(deck_data, output_path):
    """Genera una griglia JPG (Deck Sheet) per Tabletop Simulator."""
    all_cards_paths = []
    
    # --- 1. CARTE DEL MAZZO (Slot 0-39) ---
    for card in deck_data.get('cards', []):
        card_name = card.get('name', '').strip()
        image_url = card.get('image_url', '')
        copies = card.get('count', 1)
        found = False
        
        # Prova a usare l'image_url dal database (molto più preciso)
        if image_url:
            filename = os.path.basename(image_url)
            path = os.path.join(CARDS_FOLDER, filename)
            if os.path.exists(path):
                for _ in range(copies):
                    all_cards_paths.append(path)
                found = True
        
        # Fallback Ricerca per Nome
        if not found:
            for ext in ['.png', '.jpg', '.jpeg']:
                path = os.path.join(CARDS_FOLDER, f"{card_name}{ext}")
                if os.path.exists(path):
                    for _ in range(copies):
                        all_cards_paths.append(path)
                    found = True
                    break
        
        if not found:
            print(f"⚠️ Immagine non trovata: {card_name}")
            
    # --- 2. INIEZIONE COSTRUTTORE (Ultima Posizione - Slot 40) ---
    c_name = deck_data.get('costruttore_name', 'Costruttore')
    c_url = deck_data.get('costruttore_image_url', '')
    if c_url:
        c_filename = os.path.basename(c_url)
        c_path = os.path.join(CARDS_FOLDER, c_filename)
        if os.path.exists(c_path):
            all_cards_paths.append(c_path)
            print(f"✅ Costruttore Inserito in coda: {c_name}")
            
    num_total = len(all_cards_paths)
    if num_total == 0:
        print("❌ Nessuna immagine trovata per il mazzo TTS.")
        return

    # Griglia Standard TTS 10x7
    COLS = 10
    ROWS = 7
    deck_sheet = Image.new('RGB', (COLS * CARD_WIDTH, ROWS * CARD_HEIGHT), color=(0, 0, 0))

    for index, img_path in enumerate(all_cards_paths):
        if index >= COLS * ROWS: break # Limite massimo TTS
        try:
            img = Image.open(img_path).convert('RGB')
            img = img.resize((CARD_WIDTH, CARD_HEIGHT), Image.LANCZOS)
            col = index % COLS
            row = index // COLS
            deck_sheet.paste(img, (col * CARD_WIDTH, row * CARD_HEIGHT))
        except Exception as e:
            print(f"❌ Errore incollaggio {img_path}: {e}")

    # --- 3. FIX PROPORZIONI (Standard TTS 4096x4096 con Centratura) ---
    TARGET_WIDTH = 4096
    TARGET_HEIGHT = 4096
    
    # Calcolo dimensioni slot e ridimensionamento mantenendo l'aspetto
    SLOT_W = TARGET_WIDTH / COLS  # 409.6
    SLOT_H = TARGET_HEIGHT / ROWS # 585.1
    
    # Rapporto originale carta: CARD_HEIGHT / CARD_WIDTH (~1.4)
    # Dobbiamo adattare la carta allo slot senza deformarla
    # In un quadrato 10x7, lo slot è 410x585 (~1.42), quasi perfetto per la carta (~1.40)
    NEW_H = SLOT_H
    NEW_W = NEW_H * (CARD_WIDTH / CARD_HEIGHT) # ~418.0? No, ricalcoliamo
    # Se NEW_H = 585, NEW_W = 585 * (744/1039) = 418.9 -> supererebbe lo slot (409.6)
    # Quindi usiamo la larghezza come limite
    NEW_W = SLOT_W
    NEW_H = NEW_W * (CARD_HEIGHT / CARD_WIDTH) # ~571.8
    
    final_sheet = Image.new('RGB', (TARGET_WIDTH, TARGET_HEIGHT), color=(0, 0, 0))

    for index, img_path in enumerate(all_cards_paths):
        if index >= COLS * ROWS: break
        try:
            img = Image.open(img_path).convert('RGB')
            # Ridimensionamento proporzionale
            img = img.resize((int(NEW_W), int(NEW_H)), Image.LANCZOS)
            
            col = index % COLS
            row = index // COLS
            
            # Centratura nello slot
            offset_x = int(col * SLOT_W + (SLOT_W - NEW_W) / 2)
            offset_y = int(row * SLOT_H + (SLOT_H - NEW_H) / 2)
            
            final_sheet.paste(img, (offset_x, offset_y))
        except Exception as e:
            print(f"❌ Errore incollaggio {img_path}: {e}")

    final_sheet.save(output_path, quality=92, subsampling=0)
    print(f"✅ JPG TTS Standard Quadrato (41 Carte): {output_path} ({TARGET_WIDTH}x{TARGET_HEIGHT})")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python deckbuilder.py <json_file_path> <format: pdf|tts>")
        sys.exit(1)

    json_path = sys.argv[1]
    export_format = sys.argv[2]
    
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            deck = json.load(f)
            
        filename = f"deck_export_{deck.get('_id', 'temp')}"
        
        if export_format == "pdf":
            generate_pdf(deck, os.path.join(OUTPUT_FOLDER, f"{filename}.pdf"))
        elif export_format == "tts":
            generate_tts_jpg(deck, os.path.join(OUTPUT_FOLDER, f"{filename}.jpg"))
        else:
            print(f"❌ Formato non supportato: {export_format}")
            
    except Exception as e:
        print(f"❌ Errore durante l'export: {e}")
