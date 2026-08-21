<template>
  <footer class="app-footer">
    <div class="footer-content">
      <p class="copyright">
        &copy; 2026 お薬管理アプリ All Rights Reserved.
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
// 現時点でプロパティやイベントの発火は不要なため、シンプルな構成としています。
</script>

<style scoped>
.app-footer {
  width: 100%;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 16px 0;
  margin-top: auto;
}

.footer-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 16px;
  text-align: center;
}

.copyright {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}
</style>