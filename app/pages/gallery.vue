<script setup lang="ts">
import type { GalleryTemplate } from '~/utils/gallery'

definePageMeta({ layout: 'marketing' })

// Build-time static load of every submitted template. Glob is relative to this
// file: app/pages -> app/gallery/<slug>/template.json.
const modules = import.meta.glob('../gallery/*/template.json', { eager: true, import: 'default' })
const templates = Object.values(modules) as GalleryTemplate[]

// Stash the chosen design; the editor applies it on mount via the import path.
function useTemplate(t: GalleryTemplate) {
  sessionStorage.setItem('storeshots:apply', JSON.stringify({ __storeshots: 1, config: t.config }))
  navigateTo('/editor')
}

useSeoMeta({
  title: 'Gallery — Storeshots',
  description: 'Community-submitted screenshot templates. Open one in the editor and make it yours.',
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12">
    <header class="mb-10 text-center">
      <h1 class="text-3xl font-bold tracking-tight">Template gallery</h1>
      <p class="mt-2 text-[var(--ui-text-muted)]">
        Community-made designs. Open one in the editor, swap in your screenshots, and export.
      </p>
      <UButton
        class="mt-4"
        to="https://github.com/eralpozcan/storeshots/blob/main/CONTRIBUTING.md#submitting-a-gallery-template"
        target="_blank"
        variant="subtle"
        icon="i-lucide-heart-handshake"
        label="Submit your own"
      />
    </header>

    <p v-if="!templates.length" class="text-center text-[var(--ui-text-muted)]">
      No templates yet — be the first to submit one.
    </p>

    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="t in templates" :key="t.slug" :ui="{ body: 'p-0' }">
        <!-- Hosted preview image when provided, else a live palette + headline preview. -->
        <img
          v-if="t.previewImage"
          :src="t.previewImage"
          :alt="t.title"
          loading="lazy"
          class="aspect-[9/16] w-full object-cover"
        >
        <div
          v-else
          class="flex aspect-[9/16] items-center justify-center p-6 text-center"
          :style="{ background: `linear-gradient(160deg, ${t.config.colors.bgFrom}, ${t.config.colors.bgTo})` }"
        >
          <p
            class="whitespace-pre-line text-2xl font-bold leading-tight"
            :style="{ color: t.config.colors.textLight }"
          >
            {{ t.config.copy[0]?.headline || t.title }}
          </p>
        </div>

        <div class="space-y-3 p-4">
          <div>
            <h2 class="font-semibold">{{ t.title }}</h2>
            <p v-if="t.author" class="text-sm text-[var(--ui-text-muted)]">
              by
              <ULink
                v-if="t.authorUrl && /^https?:\/\//i.test(t.authorUrl)"
                :to="t.authorUrl"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="underline"
              >{{ t.author }}</ULink>
              <span v-else>{{ t.author }}</span>
            </p>
          </div>
          <div v-if="t.tags.length" class="flex flex-wrap gap-1.5">
            <UBadge v-for="tag in t.tags" :key="tag" :label="tag" variant="subtle" size="sm" />
          </div>
          <UButton block icon="i-lucide-wand-2" label="Use template" @click="useTemplate(t)" />
        </div>
      </UCard>
    </div>
  </div>
</template>
