import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttachmentFormData } from '../utils/attachmentFormData.js';

test('createAttachmentFormData uses the files field name expected by the backend upload route', () => {
  const file = new File(['hello'], 'report.png', { type: 'image/png' });
  const entry = {
    file,
    category: 'B超',
    tags: ['12周', '复查']
  };

  const formData = createAttachmentFormData(entry);

  assert.equal(formData.get('files').name, 'report.png');
  assert.equal(formData.get('category'), 'B超');
  assert.equal(formData.get('tags'), JSON.stringify(['12周', '复查']));
  assert.equal(formData.get('file'), null);
});
