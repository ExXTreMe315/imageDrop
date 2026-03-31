<script setup lang="ts">
const isDragging = ref(false)
const isUploading = ref(false)
const uploadedUrl = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const copied = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)

// Full-page drag and drop
function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  // Only trigger when leaving the window
  if (!e.relatedTarget) {
    isDragging.value = false
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadFile(file)
}

// Paste support
function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) uploadFile(file)
      break
    }
  }
}

// File input
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) uploadFile(file)
}

async function uploadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please upload an image file.'
    return
  }

  errorMessage.value = null
  uploadedUrl.value = null
  copied.value = false
  imagePreview.value = URL.createObjectURL(file)
  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    })

    uploadedUrl.value = `${window.location.origin}${response.url}`
    await copyToClipboard(uploadedUrl.value)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string }
    errorMessage.value = e?.data?.statusMessage ?? e?.message ?? 'Upload failed.'
    imagePreview.value = null
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  } catch {
    // Fallback for non-secure contexts
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  }
}

function reset() {
  uploadedUrl.value = null
  imagePreview.value = null
  errorMessage.value = null
  copied.value = false
  if (fileInput.value) fileInput.value.value = ''
}

onMounted(() => {
  window.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', onPaste)
})
</script>

<template>
  <div
    class="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 select-none"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Drag overlay -->
    <Transition name="fade">
      <div
        v-if="isDragging"
        class="fixed inset-0 z-50 bg-blue-600/30 border-4 border-dashed border-blue-400 flex items-center justify-center pointer-events-none"
      >
        <p class="text-4xl font-bold text-blue-200 drop-shadow-lg">Drop image here</p>
      </div>
    </Transition>

    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-4xl font-bold tracking-tight mb-1">img</h1>
      <p class="text-gray-400 text-sm">Upload · Share · Done</p>
    </div>

    <!-- Upload card -->
    <div class="w-full max-w-lg">
      <!-- Upload area (shown when no upload yet) -->
      <div v-if="!uploadedUrl && !isUploading">
        <button
          type="button"
          class="w-full rounded-2xl border-2 border-dashed border-gray-600 hover:border-blue-500 bg-gray-900 hover:bg-gray-800 transition-colors duration-200 p-12 flex flex-col items-center gap-4 cursor-pointer group"
          @click="fileInput?.click()"
        >
          <svg class="w-14 h-14 text-gray-500 group-hover:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4 4 4" />
          </svg>
          <div class="text-center">
            <p class="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">Click to upload</p>
            <p class="text-sm text-gray-500 mt-1">or drag &amp; drop · paste (Ctrl+V)</p>
            <p class="text-xs text-gray-600 mt-2">JPG, PNG, GIF, WebP, SVG · max 20 MB</p>
          </div>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        />
      </div>

      <!-- Uploading state -->
      <div v-else-if="isUploading" class="rounded-2xl bg-gray-900 p-12 flex flex-col items-center gap-4">
        <div v-if="imagePreview" class="w-32 h-32 rounded-xl overflow-hidden bg-gray-800">
          <img :src="imagePreview" alt="Preview" class="w-full h-full object-cover" />
        </div>
        <div class="flex items-center gap-3 text-gray-300">
          <svg class="w-5 h-5 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span class="text-sm font-medium">Uploading…</span>
        </div>
      </div>

      <!-- Success state -->
      <div v-else-if="uploadedUrl" class="rounded-2xl bg-gray-900 p-6 flex flex-col gap-5">
        <!-- Preview -->
        <div v-if="imagePreview" class="rounded-xl overflow-hidden bg-gray-800 max-h-72 flex items-center justify-center">
          <img :src="imagePreview" alt="Uploaded image" class="max-w-full max-h-72 object-contain" />
        </div>

        <!-- URL display -->
        <div class="flex flex-col gap-2">
          <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold">Image URL</p>
          <div class="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-3">
            <a
              :href="uploadedUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 text-sm text-blue-400 hover:text-blue-300 truncate transition-colors"
            >{{ uploadedUrl }}</a>
            <button
              type="button"
              class="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
              :class="copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'"
              @click="copyToClipboard(uploadedUrl!)"
            >
              <svg v-if="copied" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2" stroke-linejoin="round" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <p v-if="copied" class="text-xs text-green-400 text-center">✓ URL auto-copied to clipboard</p>
        </div>

        <!-- Upload another -->
        <button
          type="button"
          class="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
          @click="reset"
        >
          Upload another image
        </button>
      </div>

      <!-- Error message -->
      <div v-if="errorMessage" class="mt-4 rounded-xl bg-red-900/40 border border-red-700 px-4 py-3 flex items-start gap-3">
        <svg class="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke-width="2" />
          <path stroke-linecap="round" stroke-width="2" d="M12 8v4m0 4h.01" />
        </svg>
        <p class="text-sm text-red-300">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- Footer -->
    <p class="mt-10 text-xs text-gray-700">Paste · Drag &amp; Drop · Click</p>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
