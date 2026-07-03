<template>
  <div class="record-form-container">
    <header class="form-header">
      <el-button @click="handleBack" text>
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="form-title">{{ isEditMode ? '编辑记录' : '新建记录' }}</h1>
      <div style="width: 80px;"></div>
    </header>

    <main class="form-main">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="record-form"
      >
        <el-form-item label="产检日期" prop="checkupDate">
          <el-date-picker
            v-model="formData.checkupDate"
            type="date"
            placeholder="选择产检日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="孕周" prop="gestationalWeek">
          <el-input-number
            v-model="formData.gestationalWeek"
            :min="0"
            :max="45"
            placeholder="孕周"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="孕周天数" prop="gestationalDay">
          <el-input-number
            v-model="formData.gestationalDay"
            :min="0"
            :max="6"
            placeholder="天数（0-6）"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="医院" prop="hospital">
          <el-input
            v-model="formData.hospital"
            placeholder="医院名称"
          />
        </el-form-item>

        <el-form-item label="医生" prop="doctor">
          <el-input
            v-model="formData.doctor"
            placeholder="医生姓名"
          />
        </el-form-item>

        <el-divider content-position="left">生理指标</el-divider>

        <el-form-item label="体重" prop="vitals.weight">
          <el-input-number
            v-model="formData.vitals.weight"
            :min="0"
            :max="200"
            :precision="1"
            placeholder="体重"
            style="width: 100%"
          >
            <template #append>kg</template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="血压">
          <div class="blood-pressure-group">
            <el-form-item prop="vitals.bloodPressure.systolic" style="margin-bottom: 0; flex: 1;">
              <el-input-number
                v-model="formData.vitals.bloodPressure.systolic"
                :min="0"
                :max="300"
                placeholder="收缩压"
                style="width: 100%"
              />
            </el-form-item>
            <span style="margin: 0 8px;">/</span>
            <el-form-item prop="vitals.bloodPressure.diastolic" style="margin-bottom: 0; flex: 1;">
              <el-input-number
                v-model="formData.vitals.bloodPressure.diastolic"
                :min="0"
                :max="200"
                placeholder="舒张压"
                style="width: 100%"
              />
            </el-form-item>
            <span style="margin-left: 8px;">mmHg</span>
          </div>
        </el-form-item>

        <el-form-item label="宫高" prop="vitals.fundalHeight">
          <el-input-number
            v-model="formData.vitals.fundalHeight"
            :min="0"
            :max="100"
            :precision="1"
            placeholder="宫高"
            style="width: 100%"
          >
            <template #append>cm</template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="腹围" prop="vitals.abdominalCircumference">
          <el-input-number
            v-model="formData.vitals.abdominalCircumference"
            :min="0"
            :max="200"
            :precision="1"
            placeholder="腹围"
            style="width: 100%"
          >
            <template #append>cm</template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="胎心率" prop="vitals.fetalHeartRate">
          <el-input-number
            v-model="formData.vitals.fetalHeartRate"
            :min="0"
            :max="300"
            placeholder="胎心率"
            style="width: 100%"
          >
            <template #append>次/分</template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="4"
            placeholder="记录本次产检的其他信息..."
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-divider content-position="left">检查报告</el-divider>

        <el-form-item v-if="!isEditMode" label="待上传图片">
          <AttachmentUpload
            mode="queue"
            :queue-items="pendingAttachments"
            @queue-change="pendingAttachments = $event"
          />
        </el-form-item>

        <template v-else>
          <el-form-item label="上传图片">
            <AttachmentUpload
              mode="upload"
              :record-id="currentRecordId"
              :existing-count="recordAttachments.length"
              @success="loadRecord"
            />
          </el-form-item>
          <AttachmentGallery
            v-if="recordAttachments.length"
            :record-id="currentRecordId"
            :attachments="recordAttachments"
            @update="loadRecord"
            @delete="loadRecord"
          />
        </template>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleSubmit"
            class="submit-btn"
          >
            {{ isEditMode ? '保存修改' : '创建记录' }}
          </el-button>
          <el-button size="large" @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { uploadAttachmentEntry } from '@/api/attachment';
import { createRecord, updateRecord, getRecordById } from '@/api/record';
import AttachmentGallery from '@/components/AttachmentGallery.vue';
import AttachmentUpload from '@/components/AttachmentUpload.vue';
import { useRecordStore } from '@/stores/record';
import { uploadQueuedAttachments } from '@/utils/attachmentQueue';

const router = useRouter();
const route = useRoute();
const recordStore = useRecordStore();

const formRef = ref(null);
const loading = ref(false);
const pendingAttachments = ref([]);
const currentRecordId = ref(route.params.id || '');
const recordAttachments = ref([]);

const isEditMode = computed(() => !!route.params.id);

const formData = reactive({
  checkupDate: '',
  gestationalWeek: null,
  gestationalDay: 0,
  hospital: '',
  doctor: '',
  vitals: {
    weight: null,
    bloodPressure: {
      systolic: null,
      diastolic: null,
    },
    fundalHeight: null,
    abdominalCircumference: null,
    fetalHeartRate: null,
  },
  notes: '',
});

const rules = {
  checkupDate: [
    { required: true, message: '请选择产检日期', trigger: 'change' },
  ],
  gestationalWeek: [
    { required: true, message: '请输入孕周', trigger: 'blur' },
  ],
  gestationalDay: [
    { required: true, message: '请输入孕周天数', trigger: 'blur' },
  ],
  hospital: [
    { required: true, message: '请输入医院名称', trigger: 'blur' },
  ],
  doctor: [
    { required: true, message: '请输入医生姓名', trigger: 'blur' },
  ],
};

// 加载记录数据（编辑模式）
const loadRecord = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    const response = await getRecordById(route.params.id);
    if (response.success) {
      const record = response.data;
      currentRecordId.value = record._id || route.params.id || '';
      recordAttachments.value = record.attachments || [];
      Object.assign(formData, {
        checkupDate: record.checkupDate,
        gestationalWeek: record.gestationalWeek,
        gestationalDay: record.gestationalDay,
        hospital: record.hospital,
        doctor: record.doctor,
        vitals: {
          weight: record.vitals?.weight || null,
          bloodPressure: {
            systolic: record.vitals?.bloodPressure?.systolic || null,
            diastolic: record.vitals?.bloodPressure?.diastolic || null,
          },
          fundalHeight: record.vitals?.fundalHeight || null,
          abdominalCircumference: record.vitals?.abdominalCircumference || null,
          fetalHeartRate: record.vitals?.fetalHeartRate || null,
        },
        notes: record.notes || '',
      });
    }
  } catch (error) {
    console.error('Failed to load record:', error);
    ElMessage.error('加载记录失败');
  } finally {
    loading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    const submitData = { ...formData };

    let response;
    if (isEditMode.value) {
      response = await updateRecord(route.params.id, submitData);
    } else {
      response = await createRecord(submitData);
    }

    if (response.success) {
      ElMessage.success(isEditMode.value ? '修改成功' : '创建成功');
      if (isEditMode.value) {
        recordStore.updateRecord(route.params.id, response.data);
        recordAttachments.value = response.data.attachments || recordAttachments.value;
      } else {
        recordStore.addRecord(response.data);
        currentRecordId.value = response.data._id;
        const uploadResult = await uploadQueuedAttachments({
          recordId: currentRecordId.value,
          queue: pendingAttachments.value,
          uploader: uploadAttachmentEntry
        });

        if (uploadResult.failed.length > 0) {
          ElMessage.warning('记录已创建，但部分检查报告上传失败，可稍后在详情页继续上传');
        }

        router.push({ name: 'RecordDetail', params: { id: currentRecordId.value } });
        return;
      }
      router.back();
    }
  } catch (error) {
    if (error.errors) {
      console.error('Validation failed:', error);
    } else {
      console.error('Submit error:', error);
    }
  } finally {
    loading.value = false;
  }
};

// 返回
const handleBack = () => {
  router.back();
};

onMounted(() => {
  loadRecord();
});
</script>

<style scoped>
.record-form-container {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.form-header {
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-main {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.record-form {
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.blood-pressure-group {
  display: flex;
  align-items: center;
  width: 100%;
}

.submit-btn {
  border-radius: var(--radius-full);
  font-weight: 500;
  min-width: 120px;
}
</style>
