import { onBeforeUnmount, onMounted } from 'vue';

/**
 * 用 IntersectionObserver 延迟加载附件预览，减少详情页首屏请求数
 */
export function useLazyAttachmentPreview(onVisible) {
  let observer = null;
  const pending = new Map();

  const observe = (el, attachmentId) => {
    if (!el) return;
    el.dataset.attachmentId = attachmentId;
    pending.set(attachmentId, el);
    observer?.observe(el);
  };

  const unobserve = (attachmentId) => {
    const el = pending.get(attachmentId);
    if (el && observer) {
      observer.unobserve(el);
    }
    pending.delete(attachmentId);
  };

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') {
      pending.forEach((_el, attachmentId) => onVisible(attachmentId));
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const attachmentId = entry.target.dataset.attachmentId;
          if (attachmentId) {
            onVisible(attachmentId);
            observer.unobserve(entry.target);
            pending.delete(attachmentId);
          }
        });
      },
      { rootMargin: '120px' }
    );

    pending.forEach((el) => observer.observe(el));
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
    pending.clear();
  });

  return { observe, unobserve };
}
