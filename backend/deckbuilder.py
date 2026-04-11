import os
import json
import math
import sys
import zipfile
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

# --- PATH CONFIGURATION (Dynamic for Production/Render) ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Note: frontend is sibling to backend in the project root
BASE_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
CARDS_FOLDER = os.path.join(BASE_DIR, "frontend/public/assets/cards")
ASSETS_TTS_FOLDER = os.path.join(SCRIPT_DIR, "assets/tts")
OUTPUT_FOLDER = os.path.join(SCRIPT_DIR, "exports")

# Ensure operational directories exist
if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

# Standard TTS (Tabletop Simulator) Dimensional Constants
CARD_WIDTH = 744
CARD_HEIGHT = 1039
TTS_COLUMNS = 10

def generate_pdf(deck_data, output_path):
    """
    Synthesizes a structured PDF document listing the deck composition.
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
        if y < 50:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 12)
            
    c.save()
    print(f"SUCCESS: PDF generated at {output_path}")

def generate_rules_pdf(output_path):
    """
    Synthesizes the INTEGRAL Joule: Zero Point Rulebook PDF using text from Regolamento 5.0.txt
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    
    # Joule Theme Constants
    J_GOLD = colors.HexColor("#fedc68")
    J_MAGENTA = colors.HexColor("#ff003c")
    J_BG = colors.HexColor("#0b0d17")
    J_TEXT = colors.HexColor("#e2e8f0")

    def draw_frame():
        c.setFillColor(J_BG)
        c.rect(0, 0, width, height, fill=1)
        c.setStrokeColor(J_GOLD)
        c.setLineWidth(0.3)
        c.rect(30, 30, width - 60, height - 60)
        # Footer
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColor(J_GOLD)
        c.drawCentredString(width/2, 20, "JOULE: ZERO POINT - MANUALE OPERATIVO UFFICIALE v5.0")

    def add_wrapped_text(text, y_pos, font="Helvetica", size=10, color=J_TEXT, indent=50, spacing=14):
        c.setFont(font, size)
        c.setFillColor(color)
        max_w = width - indent - 50
        
        paragraphs = text.split('\n')
        curr_y = y_pos
        
        for p in paragraphs:
            if not p.strip():
                curr_y -= spacing
                continue
                
            words = p.split(' ')
            line = ""
            for word in words:
                if c.stringWidth(line + word) < max_w:
                    line += word + " "
                else:
                    c.drawString(indent, curr_y, line)
                    curr_y -= spacing
                    line = word + " "
                    if curr_y < 60:
                        c.showPage()
                        draw_frame()
                        curr_y = height - 80
                        c.setFont(font, size)
                        c.setFillColor(color)
            
            c.drawString(indent, curr_y, line)
            curr_y -= spacing
            if curr_y < 60:
                c.showPage()
                draw_frame()
                curr_y = height - 80
                c.setFont(font, size)
                c.setFillColor(color)
        
        return curr_y

    # --- CONTENT EXTRACTION & PREPARATION (Full 5.0 Strings) ---
    full_rules = [
        ("1. INTRODUZIONE E CONCETTI CHIAVE", 
         "A seguito dell'evento noto come Punto Zero, le leggi dello spazio-tempo si sono infrante. In questo universo senza più regole si ergono i Costruttori, entità visionarie il cui scopo è ripristinare l'equilibrio. Tuttavia, ogni Costruttore possiede una visione radicalmente opposta di come debba essere questo nuovo ordine: c'è chi cerca la perfezione del gelo assoluto, chi il caos purificatore del calore e chi l'adattabilità dei fluidi.\n\n"
         "Componenti: Mazzo da 40 carte + 1 Costruttore. Segnalini: ET (Energia Temporale), IT (Integrità Temporale), TP (Temperatura del Presente), Surriscaldamento (Red), Congelamento (Blue).\n"
         "Valori Fondamentali:\n"
         "• ET: Risorsa per giocare carte.\n"
         "• PEP: Pressione Energetica (attacco).\n"
         "• RP: Resistenza del Presente (difesa).\n"
         "• IT: Punti vita.\n"
         "• TP: Stato termico globale del Presente.\n\n"
         "Zona di Attivazione: Salvo diversa indicazione, un Frammento applica il proprio testo solo mentre si trova nel Presente. Se un Frammento si trova nel Passato o nel Futuro, ignora completamente il proprio testo, ad eccezione di eventuali effetti che menzionano esplicitamente quella colonna."),
        
        ("2. PREPARAZIONE DELLA PARTITA (SETUP)",
         "1. Ogni giocatore sceglie un mazzo da 40 carte e 1 Costruttore.\n"
         "2. Valori iniziali: IT 20, TP 0, ET 3. Flusso iniziale: Normale.\n"
         "3. Ogni giocatore pesca 5 carte. Mulligan: Una sola volta rimescola e pesca 1 carta in meno (4 carte).\n"
         "4. Determinare l'Iniziativa: I giocatori tirano un dado. Chi vince sceglie chi ha l'Iniziativa. Nelle partite successive, decide chi ha perso la precedente.\n\n"
         "Condizioni di Vittoria:\n"
         "1. Vittoria per Collasso: L’IT dell’avversario scende a 0 o meno.\n"
         "2. Vittoria per Sincronia: Un giocatore controlla almeno 1 Frammento in ogni colonna e tutti e 5 gli stati della materia prima dello slittamento. (Gli eventuali stati aggiuntivi acquisiti tramite i Segnalini Termici vengono ignorati per questo calcolo)."),

        ("3. STRUTTURA DEL ROUND (IL CORE LOOP)",
         "Ogni Round segue questa sequenza: Slittamento -> Risorse -> Azioni -> Collisione -> Fine.\n\n"
         "Fase 1: Slittamento Temporale (Escluso il primo round)\n"
         "Il tempo slitta secondo la Direzione del Flusso. Flusso Normale: Futuro -> Presente -> Passato. Flusso Invertito: Passato -> Presente -> Futuro (coperto).\n"
         "Supporto del Passato (Bonus): Ogni Frammento Caldo nel Passato: +1 PEP. Ogni Freddo: +1 RP. Materia Oscura: +1 PEP o +1 RP a scelta (Limite: Max 2 bonus totali).\n\n"
         "Fase 2: Risorse\n"
         "Entrambi ottengono +1 ET (max 10) e pescano 1 carta. Chi controlla il Presente può scegliere se pescare 1 carta extra oppure infliggere 1 danno IT diretto all'avversario. Scambio: Una volta per round puoi scartare 1 carta per +1 ET.\n\n"
         "Fase 3 & 4: Azioni\n"
         "Frammenti e Anomalie solo nel proprio turno. Eventi in qualsiasi momento. Capienza: Max 4 Frammenti per colonna per giocatore.\n"
         "PARADOSSO ENTROPICO: Giocando l'ultima carta prima dell'Orizzonte degli Eventi, puoi pagare IT invece di ET (pari al costo della carta). Il Frammento entra ruotato di 90 gradi. Al prossimo Slittamento viaggerà controcorrente entrando nel Presente con PEP e RP scambiati, per poi autodistruggersi.\n\n"
         "Fase 5: Collisione\n"
         "PEP Totale vs RP Totale avversaria. Se PEP > RP, lo scudo cede: i Frammenti avversari nel Presente collassano e la differenza viene inflitta all'IT.\n"
         "Proprietà Stati: Solido (Assorbimento: -1 danno IT), Liquido (Persistenza: resta in campo), Gas (Pressione: 1 danno IT se zero danni inferti), Plasma (Scarica: +1 danno extra)."),

        ("4. IL SISTEMA DELLA TEMPERATURA (TP)",
         "La TP altera il campo di battaglia. Caldo nel Presente: +1 TP. Freddo nel Presente: -1 TP.\n"
         "La TP varia tra -4 e +4. Viene ricalcolata ogni volta che un Frammento entra o lascia il Presente.\n"
         "Segnalini Termici:\n"
         "• TP >= +2: Assegna Surriscaldamento (Red) a tutti i Frammenti nel Presente.\n"
         "• TP <= -2: Assegna Congelamento (Blue) a tutti i Frammenti nel Presente.\n"
         "Gli stati superiori/inferiori acquisiti espandono le proprietà della carta senza mutarne i fedeli valori stampati.\n\n"
         "Regola d'Oro Termodinamica: La TP 'cambia segno' anche ogni volta che il suo valore raggiunge o attraversa esattamente lo 0 partendo da un valore positivo o negativo."),

        ("5. MECCANICHE AVANZATE: LE INVERSIONI",
         "L'InversioneTemporale inverte il Flusso e scambia i ruoli delle colonne laterali (Passato <=> Futuro).\n"
         "Trigger dell'Inversione:\n"
         "1. Spontanea: Se TP raggiunge +4 o -4.\n"
         "2. Volontaria: Tramite carte idonee (Costo: 1 danno IT al giocatore).\n\n"
         "Note Tattiche:\n"
         "• La direzione fisica delle carte non cambia: cambia solo il ruolo semantico delle zone sul tavolo.\n"
         "• La Trappola del Futuro: Se giochi a Sinistra durante un Flusso Invertito (nuovo Futuro), le carte slitteranno direttamente nell'Orizzonte degli Eventi senza mai combattere!\n"
         "• Le abilità delle carte leggono solo il ruolo ATTUALE della colonna, senza memoria del passato fisico.")
    ]

    # --- PDF GENERATION ---
    draw_frame()
    y = height - 80
    
    # Title
    c.setFont("Helvetica-Bold", 30)
    c.setFillColor(J_GOLD)
    c.drawCentredString(width/2, y, "JOULE: ZERO POINT")
    y -= 35
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(J_MAGENTA)
    c.drawCentredString(width/2, y, "REGOLAMENTO UFFICIALE - VERSIONE 5.0")
    y -= 50

    for section_title, content in full_rules:
        # Check space for header
        if y < 100:
            c.showPage()
            draw_frame()
            y = height - 80
            
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(J_GOLD)
        c.drawString(50, y, f"> {section_title}")
        c.setStrokeColor(J_MAGENTA)
        c.setLineWidth(1.5)
        c.line(50, y - 5, 250, y - 5)
        y -= 35
        
        y = add_wrapped_text(content, y)
        y -= 20 # Extra spacing between sections

    c.save()
    print(f"SUCCESS: Integral 5.0 Rules PDF generated at {output_path}")

def generate_tts_manual(output_path):
    """
    Synthesizes a quick-start manual for TTS integration.
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    J_GOLD = colors.HexColor("#fedc68")
    J_MAGENTA = colors.HexColor("#ff003c")
    J_BG = colors.HexColor("#0b0d17")
    J_TEXT = colors.HexColor("#e2e8f0")

    # Background and Frame
    c.setFillColor(J_BG)
    c.rect(0, 0, width, height, fill=1)
    c.setStrokeColor(J_GOLD)
    c.rect(30, 30, width - 60, height - 60)

    # Title
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(J_GOLD)
    c.drawCentredString(width/2, height - 80, "JOULE: ZERO POINT - TTS KIT")
    
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(J_MAGENTA)
    c.drawCentredString(width/2, height - 110, "PROTOCOLLO DI INTEGRAZIONE DIGITALE")
    
    # Instructions
    y = height - 160
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(J_GOLD)
    c.drawString(60, y, "> CONFIGURAZIONE TABLETOP SIMULATOR")
    y -= 40
    
    steps = [
        "1. CARICAMENTO: Objects > Components > Cards > Custom Deck.",
        "2. FACCIATE (Front): Seleziona 'Fronte_Mazzo.jpg' contenuto in questo kit.",
        "3. RETRO (Back): Seleziona 'Retro_Ufficiale.png' contenuto in questo kit.",
        "4. MATRICE GRIGLIA: Imposta Width a 10 e Height a 7.",
        "5. NUMERO UNITÀ: Imposta 'Number of Cards' a 41 (Standard Joule).",
        "6. INIZIALIZZA: Clicca su Import.",
        "",
        "TIP: Premi 'F' per girare la carta, 'G' per raggruppare, 'ALT' per lo zoom."
    ]
    
    c.setFont("Helvetica", 12)
    c.setFillColor(J_TEXT)
    for step in steps:
        c.drawString(60, y, step)
        y -= 25
        
    # Footer
    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(J_GOLD)
    c.drawCentredString(width/2, 50, "Punto Zero stabilizzato. Buona battaglia, Costruttore.")
    
    c.save()
    print(f"SUCCESS: TTS Manual generated at {output_path}")

def generate_tts_jpg(deck_data, output_path):
    """
    Generates a 10x7 grid sheet for Tabletop Simulator.
    """
    all_cards_paths = []
    for card in deck_data.get('cards', []):
        copies = card.get('count', 1)
        image_url = card.get('image_url', '')
        if image_url:
            filename = os.path.basename(image_url)
            path = os.path.join(CARDS_FOLDER, filename)
            if os.path.exists(path):
                for _ in range(copies):
                    all_cards_paths.append(path)
    
    # Builder
    c_url = deck_data.get('costruttore_image_url', '')
    if c_url:
        c_path = os.path.join(CARDS_FOLDER, os.path.basename(c_url))
        if os.path.exists(c_path):
            all_cards_paths.append(c_path)

    if not all_cards_paths:
        print("FAILURE: No image assets found.")
        return False

    COLS, ROWS = 10, 7
    TARGET_SIZE = 4096
    SLOT_W, SLOT_H = TARGET_SIZE / COLS, TARGET_SIZE / ROWS
    NEW_W = SLOT_W
    NEW_H = NEW_W * (CARD_HEIGHT / CARD_WIDTH)

    final_sheet = Image.new('RGB', (TARGET_SIZE, TARGET_SIZE), color=(0, 0, 0))
    for index, img_path in enumerate(all_cards_paths):
        if index >= COLS * ROWS: break
        try:
            img = Image.open(img_path).convert('RGB')
            img = img.resize((int(NEW_W), int(NEW_H)), Image.LANCZOS)
            col, row = index % COLS, index // COLS
            offset_x = int(col * SLOT_W + (SLOT_W - NEW_W) / 2)
            offset_y = int(row * SLOT_H + (SLOT_H - NEW_H) / 2)
            final_sheet.paste(img, (offset_x, offset_y))
        except Exception as e:
            print(f"ERROR: {img_path}: {e}")

    final_sheet.save(output_path, quality=92, subsampling=0)
    print(f"SUCCESS: TTS sheet generated at {output_path}")
    return True

def generate_tts_kit(deck_data, output_zip_path):
    """
    Bundles TTS sheet, official card back, and manual into a single ZIP archive.
    """
    deck_id = deck_data.get('id', 'temp')
    tmp_front = os.path.join(OUTPUT_FOLDER, f"Fronte_Mazzo_{deck_id}.jpg")
    tmp_manual = os.path.join(OUTPUT_FOLDER, f"Guida_Integrazione_TTS_{deck_id}.pdf")
    official_back = os.path.join(ASSETS_TTS_FOLDER, "card_back.png")

    # 1. Generate Front Sheet
    if not generate_tts_jpg(deck_data, tmp_front):
        return False

    # 2. Generate Manual
    generate_tts_manual(tmp_manual)

    # 3. Create ZIP
    try:
        with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipk:
            # Add dynamic assets
            zipk.write(tmp_front, "Fronte_Mazzo.jpg")
            zipk.write(tmp_manual, "Guida_Rapida_TTS.pdf")
            
            # Add official back (if exists)
            if os.path.exists(official_back):
                zipk.write(official_back, "Retro_Ufficiale.png")
            else:
                print(f"WARNING: Official back NOT FOUND at {official_back}")

        # Cleanup temporary build files
        if os.path.exists(tmp_front): os.remove(tmp_front)
        if os.path.exists(tmp_manual): os.remove(tmp_manual)
            
        print(f"SUCCESS: Digital Integration Kit (ZIP) generated at {output_zip_path}")
        return True
    except Exception as e:
        print(f"FAILURE: ZIP creation failed: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python deckbuilder.py <json_path|rules> [format]")
        sys.exit(1)

    cmd = sys.argv[1]
    
    if cmd == "rules":
        output = os.path.join(OUTPUT_FOLDER, "regolamento_joule.pdf")
        generate_rules_pdf(output)
    else:
        if len(sys.argv) < 3:
            sys.exit(1)
        json_path, export_format = sys.argv[1], sys.argv[2]
        with open(json_path, 'r', encoding='utf-8') as f:
            deck = json.load(f)
        
        filename_base = f"deck_export_{deck.get('id', 'temp')}"
        if export_format == "pdf":
            generate_pdf(deck, os.path.join(OUTPUT_FOLDER, f"{filename_base}.pdf"))
        elif export_format == "tts":
            # TTS now produces a KIT (ZIP)
            generate_tts_kit(deck, os.path.join(OUTPUT_FOLDER, f"{filename_base}.zip"))
