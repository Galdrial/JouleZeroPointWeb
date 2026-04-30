import { ref, type Ref, unref } from "vue";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { useNotificationStore } from "../stores/notificationStore";
import type { Card } from "../stores/cardStore";
import type { SavedDeck } from "../stores/deckStore";

export function useDeckExport(
  allCards: Ref<Card[]> | Card[],
  decks: Ref<SavedDeck[]> | SavedDeck[],
) {
  const notifications = useNotificationStore();
  const isExporting = ref(false);
  const exportingId = ref<string | number | null>(null);
  const exportingFormat = ref<"pdf" | "tts" | null>(null);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const toSafeFileName = (name: string) =>
    name
      .trim()
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_")
      .replace(/\.+$/g, "")
      .slice(0, 80) || "Mazzo";

  const handleExport = async (deckId: string | number, format: "pdf" | "tts") => {
    if (isExporting.value) return;
    isExporting.value = true;
    exportingId.value = deckId;
    exportingFormat.value = format;

    notifications.info(
      `Inizializzazione protocollo ${format.toUpperCase()} locale... attendere.`,
    );

    try {
      const cardsArr = unref(allCards);
      const decksArr = unref(decks);

      const deckInfo = decksArr.find(
        (d: SavedDeck) => String(d.id) === String(deckId),
      );
      if (!deckInfo) throw new Error("Mazzo non trovato in cache.");

      const costruttoreCard = cardsArr.find(
        (c) => String(c.id) === String(deckInfo.costruttoreId),
      );

      if (format === "pdf") {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setTextColor(254, 220, 104);
        doc.setFontSize(22);
        doc.text("JOULE: ZERO POINT - REGISTRO COSTRUTTORE", 105, 20, {
          align: "center",
        });

        doc.setFontSize(14);
        doc.setTextColor(255, 0, 60);
        doc.text(
          `NOME DISPOSITIVO: ${deckInfo.name.toUpperCase()}`,
          105,
          30,
          { align: "center" },
        );

        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text(
          `COSTRUTTORE: ${costruttoreCard?.name || "Sconosciuto"}`,
          20,
          50,
        );

        let y = 60;
        doc.setFont("helvetica", "normal");

        deckInfo.cards.forEach((dc) => {
          const card = cardsArr.find(
            (c) => String(c.id) === String(dc.cardId),
          );
          if (card) {
            const pep = card.pep !== null ? card.pep : 0;
            const rp = card.rp !== null ? card.rp : 0;
            doc.text(
              `${dc.count}x  ${card.name} (${card.type}) - PEP:${pep} RP:${rp}`,
              20,
              y,
            );
            y += 8;
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
          }
        });

        doc.save(`Joule_PDF_Kit_${deckId}.pdf`);
      } else if (format === "tts") {
        const canvas = document.createElement("canvas");
        canvas.width = 4096;
        canvas.height = 4096;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Impossibile inizializzare rendering hardware locale.");

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 4096, 4096);

        const cols = 10;
        const rows = 7;
        const slotW = 4096 / cols;
        const slotH = 4096 / rows;

        const imageSources: string[] = [];
        deckInfo.cards.forEach((dc) => {
          const card = cardsArr.find(
            (c) => String(c.id) === String(dc.cardId),
          );
          if (card && card.image_url) {
            for (let i = 0; i < dc.count; i++) imageSources.push(card.image_url);
          }
        });
        if (costruttoreCard?.image_url) {
          imageSources.push(costruttoreCard.image_url);
        }

        for (let i = 0; i < imageSources.length && i < cols * rows; i++) {
          try {
            const img = await loadImage(imageSources[i]);
            const col = i % cols;
            const row = Math.floor(i / cols);
            ctx.drawImage(img, col * slotW, row * slotH, slotW, slotH);
          } catch {
            // Skip unloadable image — slot remains black
          }
        }

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject()),
            "image/jpeg",
            0.92,
          );
        });

        const zip = new JSZip();
        zip.file("Fronte_Mazzo.jpg", blob);

        try {
          const backBlob = await fetch("/Retro_Ufficiale.png").then((r) =>
            r.blob(),
          );
          zip.file("Retro_Ufficiale.png", backBlob);
        } catch {
          // Back image not available — zip ships without it
        }

        zip.file(
          "Leggimi_TTS.txt",
          `1. CARICAMENTO: Objects > Components > Cards > Custom Deck.
2. FACCIATE (Front): Seleziona 'Fronte_Mazzo.jpg'.
3. RETRO (Back): Seleziona 'Retro_Ufficiale.png'.
4. MATRICE: Height 7, Width 10.
5. NUMERO UNITA': 41.`,
        );

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(zipBlob);
        link.download = `Joule_TTS_Kit_${toSafeFileName(deckInfo.name)}.zip`;
        link.click();
        window.URL.revokeObjectURL(link.href);
      }

      notifications.success(
        `Sincronizzazione ${format.toUpperCase()} completata con successo sul tuo dispositivo!`,
      );
    } catch (e: unknown) {
      notifications.error(
        e instanceof Error
          ? e.message
          : "Errore durante la generazione del file. Riprova.",
      );
    } finally {
      isExporting.value = false;
      exportingId.value = null;
      exportingFormat.value = null;
    }
  };

  return {
    isExporting,
    exportingId,
    exportingFormat,
    handleExport,
  };
}
