import os
import json
import math
import sys
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

# --- PATH CONFIGURATION ---
# Base directory for the Joule: Zero Point project artifacts
BASE_DIR = "/home/simone/Documenti/start2impact/JouleZeroPointDev"
CARDS_FOLDER = os.path.join(BASE_DIR, "frontend/public/assets/cards")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "backend/exports")

# Standard TTS (Tabletop Simulator) Dimensional Constants
CARD_WIDTH = 744
CARD_HEIGHT = 1039
TTS_COLUMNS = 10

def generate_pdf(deck_data, output_path):
    """
    Synthesizes a structured PDF document listing the deck composition.
    Includes creator metadata and card counts.
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    y = height - 50
    
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, f"Joule: Zero Point - Decklist: {deck_data.get('name', 'Untitled Deck')}")
    y -= 30
    
    c.setFont("Helvetica", 12)
    c.drawString(50, y, f"Creator: {deck_data.get('creator', 'Anonymous')}")
    y -= 40
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "DECK COMPOSITION:")
    y -= 25
    
    c.setFont("Helvetica", 12)
    for card in deck_data.get('cards', []):
        line = f"• {card.get('count', 1)}x {card.get('name', 'Unknown Card')} ({card.get('type', 'Fragment')})"
        c.drawString(60, y, line)
        y -= 20
        
        # Pagination Control: Pulse to new page if vertical threshold is reached
        if y < 50:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 12)
            
    c.save()
    print(f"SUCCESS: PDF generated at {output_path}")

def generate_tts_jpg(deck_data, output_path):
    """
    Generates a 4096x4096px grid (Deck Sheet) optimized for Tabletop Simulator ingestion.
    Supports a standard 10x7 grid configuration.
    """
    all_cards_paths = []
    
    # --- 1. CARD INGESTION (Slots 0-39) ---
    for card in deck_data.get('cards', []):
        card_name = card.get('name', '').strip()
        image_url = card.get('image_url', '')
        copies = card.get('count', 1)
        found = False
        
        # Primary Retrieval: Attempt precise identification via image_url
        if image_url:
            filename = os.path.basename(image_url)
            path = os.path.join(CARDS_FOLDER, filename)
            if os.path.exists(path):
                for _ in range(copies):
                    all_cards_paths.append(path)
                found = True
        
        # Fallback Retrieval: Heuristic identification via name matching
        if not found:
            for ext in ['.png', '.jpg', '.jpeg']:
                path = os.path.join(CARDS_FOLDER, f"{card_name}{ext}")
                if os.path.exists(path):
                    for _ in range(copies):
                        all_cards_paths.append(path)
                    found = True
                    break
        
        if not found:
            print(f"WARNING: Asset not found for card: {card_name}")
            
    # --- 2. BUILDER INJECTION (Master Slot 40) ---
    c_name = deck_data.get('costruttore_name', 'Builder')
    c_url = deck_data.get('costruttore_image_url', '')
    if c_url:
        c_filename = os.path.basename(c_url)
        c_path = os.path.join(CARDS_FOLDER, c_filename)
        if os.path.exists(c_path):
            all_cards_paths.append(c_path)
            print(f"SUCCESS: Builder artifact injected into stream: {c_name}")
            
    num_total = len(all_cards_paths)
    if num_total == 0:
        print("FAILURE: No valid image assets identified for TTS deck generation.")
        return

    # Standard TTS Grid: 10 columns by 7 rows
    COLS = 10
    ROWS = 7
    # Note: deck_sheet is a temporary intermediary surface
    deck_sheet = Image.new('RGB', (COLS * CARD_WIDTH, ROWS * CARD_HEIGHT), color=(0, 0, 0))

    for index, img_path in enumerate(all_cards_paths):
        if index >= COLS * ROWS: break # Max TTS capacity reached
        try:
            img = Image.open(img_path).convert('RGB')
            img = img.resize((CARD_WIDTH, CARD_HEIGHT), Image.LANCZOS)
            col = index % COLS
            row = index // COLS
            deck_sheet.paste(img, (col * CARD_WIDTH, row * CARD_HEIGHT))
        except Exception as e:
            print(f"ERROR: Failed to paste artifact {img_path}: {e}")

    # --- 3. RATIO SYNCHRONIZATION (Standard TTS 4096x4096px with Centering) ---
    TARGET_WIDTH = 4096
    TARGET_HEIGHT = 4096
    
    # Slot calculation and proportional scaling to maintain aspect ratio integrity
    SLOT_W = TARGET_WIDTH / COLS  # 409.6px
    SLOT_H = TARGET_HEIGHT / ROWS # 585.1px
    
    # Scale width as the primary constraint for the 10x7 aspect ratio
    NEW_W = SLOT_W
    NEW_H = NEW_W * (CARD_HEIGHT / CARD_WIDTH) # ~571.8px
    
    final_sheet = Image.new('RGB', (TARGET_WIDTH, TARGET_HEIGHT), color=(0, 0, 0))

    for index, img_path in enumerate(all_cards_paths):
        if index >= COLS * ROWS: break
        try:
            img = Image.open(img_path).convert('RGB')
            # Proportional downsampling for target grid
            img = img.resize((int(NEW_W), int(NEW_H)), Image.LANCZOS)
            
            col = index % COLS
            row = index // COLS
            
            # Centering logic within the target grid slot
            offset_x = int(col * SLOT_W + (SLOT_W - NEW_W) / 2)
            offset_y = int(row * SLOT_H + (SLOT_H - NEW_H) / 2)
            
            final_sheet.paste(img, (offset_x, offset_y))
        except Exception as e:
            print(f"ERROR: Failed to synthesize artifact {img_path}: {e}")

    final_sheet.save(output_path, quality=92, subsampling=0)
    print(f"SUCCESS: Square 4096px TTS sheet generated (41 Cards): {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python deckbuilder.py <json_file_path> <format: pdf|tts>")
        sys.exit(1)

    json_path = sys.argv[1]
    export_format = sys.argv[2]
    
    # Sector Check: Ensure the export directory is established
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
            print(f"FAILURE: Unsupported export format: {export_format}")
            
    except Exception as e:
        print(f"FAILURE: Export sequence interrupted: {e}")
