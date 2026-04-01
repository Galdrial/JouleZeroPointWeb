<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";

const props = defineProps<{
  role: "user" | "assistant" | "error";
  content: string;
  isGhost?: boolean; // For typing/ghost messages
}>();

// UI Orchestration: Deterministic roles for display
const authorLabel = computed(() => {
  if (props.role === "assistant") return "TERMINALE:";
  if (props.role === "error") return "SISTEMA:";
  return "COSTRUTTORE:";
});

const bubbleClass = computed(() => ({
  "message-bubble": true,
  "role-user": props.role === "user",
  "role-assistant": props.role === "assistant",
  "role-error": props.role === "error",
  "ghost-mode": props.isGhost,
}));

/**
 * Markdown Processing: Convert raw bytes to structured HTML directives.
 * Sanitized via DOMPurify to prevent script injection.
 * Integrates highlight.js for specialized syntax highlighting.
 */
const renderedContent = computed(() => {
  if (props.content) {
    // Custom renderer to handle syntax highlighting
    const renderer = new marked.Renderer();
    renderer.code = function({ text, lang }: { text: string; lang?: string }) {
      const validLanguage = lang && hljs.getLanguage(lang) ? lang : null;
      const highlighted = validLanguage 
        ? hljs.highlight(text, { language: validLanguage }).value 
        : hljs.highlightAuto(text).value;
      
      return `<pre><code class="hljs ${validLanguage || ''}">${highlighted}</code></pre>`;
    };

    const rawHtml = marked.parse(props.content, { 
      renderer,
      async: false 
    }) as string;
    
    return DOMPurify.sanitize(rawHtml);
  }
  return "";
});
</script>

<template>
  <div class="message-row" :class="{ 'user-row': role === 'user' }">
    <div :class="bubbleClass">
      <span class="author-tag">
        {{ authorLabel }}
      </span>
      <div class="message-content">
        <div v-if="content" v-html="renderedContent" class="markdown-body"></div>
        <slot v-else></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-row {
  display: flex;
  width: 100%;
  margin-bottom: 1.5rem;
}

.user-row {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 85%;
  padding: 1.2rem;
  border-radius: 4px;
  position: relative;
  font-family: var(--font-display);
  transition: all 0.3s ease;
}

/* Role: Assistant (Terminal) */
.role-assistant {
  background: rgba(var(--accent-magenta-rgb), 0.08);
  border-left: 2px solid var(--accent-magenta);
}

/* Role: User (Constructor) */
.role-user {
  background: rgba(var(--accent-gold-rgb), 0.08);
  border-right: 2px solid var(--accent-gold);
  text-align: right;
}

/* Role: Error (System) */
.role-error {
  background: rgba(255, 0, 0, 0.1);
  border-left: 2px solid var(--accent-magenta);
  color: #ff5555;
}

.author-tag {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
  font-weight: 800;
  text-transform: uppercase;
}

.role-assistant .author-tag {
  color: var(--accent-magenta);
}

.role-user .author-tag {
  color: var(--accent-gold);
}

.message-content {
  line-height: 1.6;
  font-size: 1rem;
  word-wrap: break-word;
}

/* Markdown Specific Styling: Thematic alignment */
.markdown-body :deep(p) {
  margin: 0 0 1rem 0;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  color: var(--accent-gold);
  font-size: 1.1rem;
  margin: 1.5rem 0 0.8rem 0;
  border-bottom: 1px solid rgba(var(--accent-gold-rgb), 0.2);
  padding-bottom: 4px;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-body :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-body :deep(strong) {
  color: var(--accent-gold);
  font-weight: 800;
}

.markdown-body :deep(code) {
  background: rgba(var(--accent-magenta-rgb), 0.1);
  color: var(--accent-magenta);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.9rem;
}

.markdown-body :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(var(--accent-magenta-rgb), 0.2);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #fff;
}

/* Syntax Highlighting Tokens: Matrix/Cyberpunk Palette */
.markdown-body :deep(.hljs-comment),
.markdown-body :deep(.hljs-quote) {
  color: #7285b7;
  font-style: italic;
}

.markdown-body :deep(.hljs-keyword),
.markdown-body :deep(.hljs-selector-tag) {
  color: #ff00ff; /* Magenta neon */
}

.markdown-body :deep(.hljs-string),
.markdown-body :deep(.hljs-attr),
.markdown-body :deep(.hljs-variable) {
  color: #ffd700; /* Gold */
}

.markdown-body :deep(.hljs-number),
.markdown-body :deep(.hljs-literal) {
  color: #00ffff; /* Cyan neon */
}

.markdown-body :deep(.hljs-function),
.markdown-body :deep(.hljs-params) {
  color: #fff;
}

.markdown-body :deep(.hljs-title) {
  color: #ff00ff;
}

/* Ghost mode for typing indicator */
.ghost-mode {
  opacity: 0.6;
}

@media (max-width: 768px) {
  .message-bubble {
    padding: 1rem;
    font-size: 0.9rem;
    max-width: 90%;
  }
}
</style>
