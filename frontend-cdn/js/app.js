// NeoAI GC Vue Application
const { createApp, ref, onMounted } = Vue;

// API Base URL - configurable for different environments
// Use env variable if available, otherwise default to localhost
const API_BASE = window.API_BASE_URL || 'http://localhost:8080/api';

// API Helper
const api = {
    // 设置token
    setToken(token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    
    // 清除token
    clearToken() {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    },
    
    // 获取token
    getToken() {
        return localStorage.getItem('token');
    },
    
    // 初始化
    init() {
        const token = this.getToken();
        if (token) {
            this.setToken(token);
        }
    }
};

// Toast 通知
const toast = {
    show(message, type = 'info') {
        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        toastEl.textContent = message;
        document.body.appendChild(toastEl);
        
        setTimeout(() => {
            toastEl.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toastEl.remove(), 300);
        }, 3000);
    },
    
    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    info(message) { this.show(message, 'info'); }
};

// Vue Components
const TextToImage = {
    template: `
        <div class="bg-card rounded-xl p-6 border border-surface">
            <div class="mb-6">
                <h3 class="text-xl font-bold mb-2">输入提示词</h3>
                <textarea 
                    v-model="prompt"
                    rows="4"
                    placeholder="描述你想要生成的图片，例如：一只可爱的猫咪坐在窗台上..."
                    class="w-full p-4 bg-surface border-2 border-transparent rounded-xl text-white focus:border-primary transition-all duration-300"></textarea>
            </div>
            
            <div class="mb-6">
                <h4 class="text-lg font-medium mb-4">快速模板</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div 
                        v-for="template in templates"
                        :key="template.id"
                        @click="selectTemplate(template)"
                        class="template-card overflow-hidden"
                        :class="{ 'selected': selectedTemplate === template.id }">
                        <img :src="template.previewImage" :alt="template.name">
                        <div class="p-3">
                            <p class="font-medium truncate">{{ template.name }}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <button 
                @click="generate"
                :disabled="generating || !prompt"
                class="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-accent text-white py-3 rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {{ generating ? '生成中...' : '生成图片' }}
            </button>
            
            <div v-if="resultUrl" class="mt-6">
                <h4 class="text-lg font-medium mb-4">生成结果</h4>
                <img :src="resultUrl" alt="生成的图片" class="w-full rounded-xl">
                <a 
                    :href="resultUrl" 
                    download="generated-image.jpg"
                    class="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-surface hover:bg-primary text-white rounded-lg transition-all duration-300">
                    <i data-lucide="download" class="w-4 h-4"></i>
                    下载图片
                </a>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const prompt = ref('');
        const generating = ref(false);
        const resultUrl = ref('');
        const templates = ref([]);
        const selectedTemplate = ref(null);
        
        const loadTemplates = async () => {
            try {
                const response = await axios.get(`${API_BASE}/template/list/type/1`);
                if (response.data.success) {
                    templates.value = response.data.data || [];
                }
            } catch (error) {
                console.error('Failed to load templates:', error);
            }
        };
        
        const selectTemplate = (template) => {
            selectedTemplate.value = template.id;
            prompt.value = template.prompt;
        };
        
        const generate = async () => {
            if (!prompt.value) {
                toast.error('请输入提示词');
                return;
            }
            
            // 检查登录状态
            if (!api.getToken()) {
                emit('require-login', { prompt: prompt.value });
                return;
            }
            
            generating.value = true;
            try {
                const formData = new FormData();
                formData.append('type', 'TEXT_TO_IMAGE');
                formData.append('prompt', prompt.value);
                
                const response = await axios.post(`${API_BASE}/task/create`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                if (response.data.success) {
                    toast.success('任务创建成功');
                    emit('task-created', response.data.taskId);
                    
                    // 轮询任务状态
                    const taskId = response.data.taskId;
                    const pollInterval = setInterval(async () => {
                        try {
                            const taskResponse = await axios.get(`${API_BASE}/task/${taskId}`);
                            const task = taskResponse.data.data;
                            
                            if (task.status === 'COMPLETED') {
                                clearInterval(pollInterval);
                                resultUrl.value = task.resultUrl;
                                generating.value = false;
                                toast.success('生成完成！');
                            } else if (task.status === 'FAILED') {
                                clearInterval(pollInterval);
                                generating.value = false;
                                toast.error('生成失败：' + task.errorMessage);
                            }
                        } catch (error) {
                            console.error('Failed to check task status:', error);
                        }
                    }, 2000);
                } else {
                    toast.error(response.data.message);
                    generating.value = false;
                }
            } catch (error) {
                console.error('Failed to create task:', error);
                toast.error('创建任务失败');
                generating.value = false;
            }
        };
        
        onMounted(() => {
            loadTemplates();
            
            // 监听登录成功事件
            document.addEventListener('login-success', async (e) => {
                const data = e.detail;
                console.log('TextToImage: Login success, data:', data);
                if (data && data.prompt) {
                    prompt.value = data.prompt;
                    await generate();
                }
            });
        });
        
        return { prompt, generating, resultUrl, templates, selectedTemplate, selectTemplate, generate };
    }
};

const ImageToImage = {
    template: `
        <div class="bg-card rounded-xl p-6 border border-surface">
            <div class="mb-6">
                <h3 class="text-xl font-bold mb-2">上传参考图片</h3>
                <div 
                    class="upload-area"
                    @click="triggerFileUpload"
                    @dragover.prevent="dragover = true"
                    @dragleave.prevent="dragover = false"
                    @drop.prevent="handleDrop">
                    <i data-lucide="upload" class="w-12 h-12 text-primary mx-auto mb-4"></i>
                    <p v-if="!previewImage" class="text-gray-400">点击或拖拽上传图片</p>
                    <img v-else :src="previewImage" alt="预览" class="max-h-64 mx-auto rounded-lg">
                    <input 
                        ref="fileInput"
                        type="file" 
                        accept="image/*"
                        @change="handleFileChange"
                        class="hidden">
                </div>
            </div>
            
            <div class="mb-6">
                <h3 class="text-xl font-bold mb-2">输入提示词</h3>
                <textarea 
                    v-model="prompt"
                    rows="3"
                    placeholder="描述你想要的效果，例如：转为油画风格..."
                    class="w-full p-4 bg-surface border-2 border-transparent rounded-xl text-white focus:border-primary transition-all duration-300"></textarea>
            </div>
            
            <div class="mb-6">
                <h4 class="text-lg font-medium mb-4">快速模板</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div 
                        v-for="template in templates"
                        :key="template.id"
                        @click="selectTemplate(template)"
                        class="template-card overflow-hidden"
                        :class="{ 'selected': selectedTemplate === template.id }">
                        <img :src="template.previewImage" :alt="template.name">
                        <div class="p-3">
                            <p class="font-medium truncate">{{ template.name }}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <button 
                @click="generate"
                :disabled="generating || !imageFile || !prompt"
                class="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-accent text-white py-3 rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {{ generating ? '生成中...' : '生成图片' }}
            </button>
            
            <div v-if="resultUrl" class="mt-6">
                <h4 class="text-lg font-medium mb-4">生成结果</h4>
                <img :src="resultUrl" alt="生成的图片" class="w-full rounded-xl">
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const imageFile = ref(null);
        const previewImage = ref('');
        const prompt = ref('');
        const generating = ref(false);
        const resultUrl = ref('');
        const templates = ref([]);
        const selectedTemplate = ref(null);
        const fileInput = ref(null);
        const dragover = ref(false);
        
        const loadTemplates = async () => {
            try {
                const response = await axios.get(`${API_BASE}/template/list/type/2`);
                if (response.data.success) {
                    templates.value = response.data.data || [];
                }
            } catch (error) {
                console.error('Failed to load templates:', error);
            }
        };
        
        const triggerFileUpload = () => {
            fileInput.value.click();
        };
        
        const handleFileChange = (event) => {
            const file = event.target.files[0];
            if (file) {
                imageFile.value = file;
                previewImage.value = URL.createObjectURL(file);
            }
        };
        
        const handleDrop = (event) => {
            dragover.value = false;
            const file = event.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                imageFile.value = file;
                previewImage.value = URL.createObjectURL(file);
            }
        };
        
        const selectTemplate = (template) => {
            selectedTemplate.value = template.id;
            prompt.value = template.prompt;
        };
        
        const generate = async () => {
            if (!imageFile.value || !prompt.value) {
                toast.error('请上传图片并输入提示词');
                return;
            }
            
            // 检查登录状态
            if (!api.getToken()) {
                emit('require-login', { file: imageFile.value, prompt: prompt.value });
                return;
            }
            
            generating.value = true;
            try {
                const formData = new FormData();
                formData.append('type', 'IMAGE_TO_IMAGE');
                formData.append('prompt', prompt.value);
                formData.append('file', imageFile.value);
                
                const response = await axios.post(`${API_BASE}/task/create`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                if (response.data.success) {
                    toast.success('任务创建成功');
                    emit('task-created', response.data.taskId);
                    generating.value = false;
                    toast.info('任务已提交，请稍后在任务历史中查看');
                } else {
                    toast.error(response.data.message);
                    generating.value = false;
                }
            } catch (error) {
                console.error('Failed to create task:', error);
                toast.error('创建任务失败');
                generating.value = false;
            }
        };
        
        onMounted(() => {
            loadTemplates();
            
            // 监听登录成功事件
            document.addEventListener('login-success', async (e) => {
                const data = e.detail;
                console.log('ImageToImage: Login success, data:', data);
                if (data && data.file && data.prompt) {
                    imageFile.value = data.file;
                    previewImage.value = URL.createObjectURL(data.file);
                    prompt.value = data.prompt;
                    await generate();
                }
            });
        });
        
        return { imageFile, previewImage, prompt, generating, resultUrl, templates, selectedTemplate, fileInput, dragover, triggerFileUpload, handleFileChange, handleDrop, selectTemplate, generate };
    }
};

const BatchMatting = {
    template: `
        <div class="bg-card rounded-xl p-6 border border-surface">
            <div class="mb-6">
                <h3 class="text-xl font-bold mb-2">上传图片</h3>
                <div 
                    class="upload-area"
                    @click="triggerFileUpload"
                    @dragover.prevent="dragover = true"
                    @dragleave.prevent="dragover = false"
                    @drop.prevent="handleDrop">
                    <i data-lucide="upload" class="w-12 h-12 text-primary mx-auto mb-4"></i>
                    <p v-if="images.length === 0" class="text-gray-400">点击或拖拽上传多张图片</p>
                    <p v-else class="text-gray-400">已选择 {{ images.length }} 张图片</p>
                    <input 
                        ref="fileInput"
                        type="file" 
                        accept="image/*"
                        multiple
                        @change="handleFileChange"
                        class="hidden">
                </div>
            </div>
            
            <div v-if="images.length > 0" class="mb-6">
                <h4 class="text-lg font-medium mb-4">已选图片</h4>
                <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div v-for="(image, index) in images" :key="index" class="relative">
                        <img :src="image.preview" class="w-full h-24 object-cover rounded-lg">
                        <button 
                            @click="removeImage(index)"
                            class="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600">
                            <i data-lucide="x" class="w-4 h-4 text-white"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <button 
                @click="process"
                :disabled="processing || images.length === 0"
                class="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-accent text-white py-3 rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {{ processing ? '处理中...' : '开始抠图' }}
            </button>
            
            <div v-if="results.length > 0" class="mt-6">
                <h4 class="text-lg font-medium mb-4">处理结果</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div v-for="(result, index) in results" :key="index" class="bg-surface rounded-lg overflow-hidden">
                        <img :src="result" class="w-full h-32 object-cover">
                        <a 
                            :href="result" 
                            download="matting-image.png"
                            class="block px-4 py-2 text-center text-primary hover:text-white hover:bg-primary transition-all">
                            下载
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const images = ref([]);
        const results = ref([]);
        const processing = ref(false);
        const fileInput = ref(null);
        const dragover = ref(false);
        
        const triggerFileUpload = () => {
            fileInput.value.click();
        };
        
        const handleFileChange = (event) => {
            const files = Array.from(event.target.files);
            files.forEach(file => {
                images.value.push({
                    file: file,
                    preview: URL.createObjectURL(file)
                });
            });
        };
        
        const handleDrop = (event) => {
            dragover.value = false;
            const files = Array.from(event.dataTransfer.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    images.value.push({
                        file: file,
                        preview: URL.createObjectURL(file)
                    });
                }
            });
        };
        
        const removeImage = (index) => {
            images.value.splice(index, 1);
        };
        
        const process = async () => {
            if (images.value.length === 0) {
                toast.error('请至少上传一张图片');
                return;
            }
            
            // 检查登录状态
            if (!api.getToken()) {
                emit('require-login', { images: images.value });
                return;
            }
            
            processing.value = true;
            try {
                // 批量处理
                for (let i = 0; i < images.value.length; i++) {
                    const formData = new FormData();
                    formData.append('type', 'BATCH_MATTING');
                    formData.append('prompt', 'Remove background');
                    formData.append('file', images.value[i].file);
                    
                    const response = await axios.post(`${API_BASE}/task/create`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    
                    if (response.data.success) {
                        toast.success(`第 ${i + 1} 张图片处理中...`);
                    }
                }
                
                toast.success('所有任务已提交');
                processing.value = false;
            } catch (error) {
                console.error('Failed to process images:', error);
                toast.error('处理失败');
                processing.value = false;
            }
        };
        
        onMounted(() => {
            // 监听登录成功事件
            document.addEventListener('login-success', async (e) => {
                const data = e.detail;
                console.log('BatchMatting: Login success, data:', data);
                if (data && data.images) {
                    images.value = data.images;
                    await process();
                }
            });
        });
        
        return { images, results, processing, fileInput, dragover, triggerFileUpload, handleFileChange, handleDrop, removeImage, process };
    }
};

const FaceSwap = {
    template: `
        <div class="bg-card rounded-xl p-6 border border-surface">
            <div class="mb-6">
                <h3 class="text-xl font-bold mb-2">上传模特图片</h3>
                <div 
                    class="upload-area"
                    @click="triggerModelUpload"
                    @dragover.prevent="dragoverModel = true"
                    @dragleave.prevent="dragoverModel = false"
                    @drop.prevent="handleModelDrop">
                    <i data-lucide="user" class="w-12 h-12 text-primary mx-auto mb-4"></i>
                    <p v-if="!modelImage" class="text-gray-400">点击或拖拽上传模特图片</p>
                    <img v-else :src="modelImage" alt="模特图片" class="max-h-64 mx-auto rounded-lg">
                    <input 
                        ref="modelInput"
                        type="file" 
                        accept="image/*"
                        @change="handleModelChange"
                        class="hidden">
                </div>
            </div>
            
            <div class="mb-6">
                <h3 class="text-xl font-bold mb-2">上传目标脸部图片</h3>
                <div 
                    class="upload-area"
                    @click="triggerFaceUpload"
                    @dragover.prevent="dragoverFace = true"
                    @dragleave.prevent="dragoverFace = false"
                    @drop.prevent="handleFaceDrop">
                    <i data-lucide="smile" class="w-12 h-12 text-secondary mx-auto mb-4"></i>
                    <p v-if="!faceImage" class="text-gray-400">点击或拖拽上传目标脸部</p>
                    <img v-else :src="faceImage" alt="目标脸部" class="max-h-64 mx-auto rounded-lg">
                    <input 
                        ref="faceInput"
                        type="file" 
                        accept="image/*"
                        @change="handleFaceChange"
                        class="hidden">
                </div>
            </div>
            
            <div class="mb-6">
                <label class="flex items-center gap-2 mb-4">
                    <input type="checkbox" v-model="enhanceBackground" class="w-4 h-4 accent-primary">
                    <span class="text-gray-300">增强背景细节，去除瑕疵</span>
                </label>
            </div>
            
            <button 
                @click="swap"
                :disabled="swapping || !modelFile || !faceFile"
                class="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-accent text-white py-3 rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {{ swapping ? '处理中...' : '开始换脸' }}
            </button>
            
            <div v-if="resultUrl" class="mt-6">
                <h4 class="text-lg font-medium mb-4">处理结果</h4>
                <img :src="resultUrl" alt="换脸结果" class="w-full rounded-xl">
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const modelFile = ref(null);
        const modelImage = ref('');
        const faceFile = ref(null);
        const faceImage = ref('');
        const enhanceBackground = ref(false);
        const swapping = ref(false);
        const resultUrl = ref('');
        const modelInput = ref(null);
        const faceInput = ref(null);
        const dragoverModel = ref(false);
        const dragoverFace = ref(false);
        
        const triggerModelUpload = () => {
            modelInput.value.click();
        };
        
        const triggerFaceUpload = () => {
            faceInput.value.click();
        };
        
        const handleModelChange = (event) => {
            const file = event.target.files[0];
            if (file) {
                modelFile.value = file;
                modelImage.value = URL.createObjectURL(file);
            }
        };
        
        const handleFaceChange = (event) => {
            const file = event.target.files[0];
            if (file) {
                faceFile.value = file;
                faceImage.value = URL.createObjectURL(file);
            }
        };
        
        const handleModelDrop = (event) => {
            dragoverModel.value = false;
            const file = event.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                modelFile.value = file;
                modelImage.value = URL.createObjectURL(file);
            }
        };
        
        const handleFaceDrop = (event) => {
            dragoverFace.value = false;
            const file = event.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                faceFile.value = file;
                faceImage.value = URL.createObjectURL(file);
            }
        };
        
        const swap = async () => {
            if (!modelFile.value || !faceFile.value) {
                toast.error('请上传模特图片和目标脸部');
                return;
            }
            
            // 检查登录状态
            if (!api.getToken()) {
                emit('require-login', { 
                    modelFile: modelFile.value, 
                    faceFile: faceFile.value,
                    enhanceBackground: enhanceBackground.value 
                });
                return;
            }
            
            swapping.value = true;
            try {
                const prompt = enhanceBackground.value ? 'Face swap with background enhancement' : 'Face swap';
                const formData = new FormData();
                formData.append('type', 'FACE_SWAP');
                formData.append('prompt', prompt);
                formData.append('file', modelFile.value);
                
                const response = await axios.post(`${API_BASE}/task/create`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                if (response.data.success) {
                    toast.success('换脸任务已提交');
                    swapping.value = false;
                } else {
                    toast.error(response.data.message);
                    swapping.value = false;
                }
            } catch (error) {
                console.error('Failed to swap face:', error);
                toast.error('换脸失败');
                swapping.value = false;
            }
        };
        
        onMounted(() => {
            // 监听登录成功事件
            document.addEventListener('login-success', async (e) => {
                const data = e.detail;
                console.log('FaceSwap: Login success, data:', data);
                if (data && data.modelFile && data.faceFile) {
                    modelFile.value = data.modelFile;
                    modelImage.value = URL.createObjectURL(data.modelFile);
                    faceFile.value = data.faceFile;
                    faceImage.value = URL.createObjectURL(data.faceFile);
                    if (data.enhanceBackground) {
                        enhanceBackground.value = data.enhanceBackground;
                    }
                    await swap();
                }
            });
        });
        
        return { modelFile, modelImage, faceFile, faceImage, enhanceBackground, swapping, resultUrl, modelInput, faceInput, dragoverModel, dragoverFace, triggerModelUpload, triggerFaceUpload, handleModelChange, handleFaceChange, handleModelDrop, handleFaceDrop, swap };
    }
};

const TaskHistory = {
    template: `
        <div class="bg-card rounded-xl p-6 border border-surface">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold">任务列表</h3>
                <button 
                    @click="refresh"
                    class="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-primary text-white rounded-lg transition-all duration-300">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    刷新
                </button>
            </div>
            
            <div v-if="tasks.length === 0" class="text-center py-12">
                <i data-lucide="inbox" class="w-16 h-16 text-gray-600 mx-auto mb-4"></i>
                <p class="text-gray-400">暂无任务记录</p>
            </div>
            
            <div v-else class="space-y-4">
                <div 
                    v-for="task in tasks" 
                    :key="task.id"
                    class="bg-surface rounded-lg p-4 hover:bg-surface/80 transition-all duration-300">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h4 class="font-medium mb-1">{{ getTypeLabel(task.type) }}</h4>
                            <p class="text-sm text-gray-400">{{ formatDate(task.createdAt) }}</p>
                        </div>
                        <span 
                            class="status-badge"
                            :class="{
                                'status-pending': task.status === 'PENDING',
                                'status-processing': task.status === 'PROCESSING',
                                'status-completed': task.status === 'COMPLETED',
                                'status-failed': task.status === 'FAILED'
                            }">
                            {{ getStatusLabel(task.status) }}
                        </span>
                    </div>
                    
                    <div v-if="task.status === 'COMPLETED' && task.resultUrl" class="mt-4">
                        <a 
                            :href="task.resultUrl" 
                            target="_blank"
                            class="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-all duration-300">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                            查看结果
                        </a>
                    </div>
                    
                    <div v-if="task.status === 'FAILED' && task.errorMessage" class="mt-4 text-sm text-red-400">
                        {{ task.errorMessage }}
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const tasks = ref([]);
        const loading = ref(false);
        
        const loadTasks = async () => {
            loading.value = true;
            try {
                const response = await axios.get(`${API_BASE}/task/list`);
                if (response.data.success) {
                    tasks.value = response.data.data || [];
                }
            } catch (error) {
                console.error('Failed to load tasks:', error);
                toast.error('加载任务列表失败');
            }
            loading.value = false;
        };
        
        const refresh = () => {
            loadTasks();
        };
        
        const getTypeLabel = (type) => {
            const labels = {
                'TEXT_TO_IMAGE': '文生图',
                'IMAGE_TO_IMAGE': '图生图',
                'BATCH_MATTING': '批量抠图',
                'FACE_SWAP': '智能换脸'
            };
            return labels[type] || type;
        };
        
        const getStatusLabel = (status) => {
            const labels = {
                'PENDING': '等待中',
                'PROCESSING': '处理中',
                'COMPLETED': '已完成',
                'FAILED': '失败'
            };
            return labels[status] || status;
        };
        
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleString('zh-CN');
        };
        
        onMounted(() => {
            loadTasks();
        });
        
        return { tasks, loading, refresh, getTypeLabel, getStatusLabel, formatDate };
    }
};

// Main App
const App = {
    components: {
        'text-to-image': TextToImage,
        'image-to-image': ImageToImage,
        'batch-matting': BatchMatting,
        'face-swap': FaceSwap,
        'task-history': TaskHistory
    },
    setup() {
        const loading = ref(true);
        const userInfo = ref(null);
        const currentView = ref('dashboard');
        const showLoginModal = ref(false);
        const showQrCodeInModal = ref(false);
        const qrCodeUrl = ref('');
        const pendingTaskData = ref(null);
        
        const navItems = [
            { id: 'dashboard', name: '工作台', icon: 'layout-dashboard' },
            { id: 'text-to-image', name: '文生图', icon: 'type' },
            { id: 'image-to-image', name: '图生图', icon: 'image-plus' },
            { id: 'batch-matting', name: '批量抠图', icon: 'scissors' },
            { id: 'face-swap', name: '智能换脸', icon: 'user-switch' },
            { id: 'tasks', name: '任务历史', icon: 'history' }
        ];
        
        const loadUserInfo = async () => {
            try {
                const response = await axios.get(`${API_BASE}/auth/user/info`);
                if (response.data.success) {
                    userInfo.value = response.data.user;
                }
            } catch (error) {
                console.error('Failed to load user info:', error);
            }
        };
        
        const getQrCodeForModal = async () => {
            try {
                const response = await axios.get(`${API_BASE}/auth/wechat/qr-code`);
                if (response.data.success) {
                    qrCodeUrl.value = response.data.qrCodeUrl;
                    showQrCodeInModal.value = true;
                    
                    // 轮询登录状态
                    const pollInterval = setInterval(async () => {
                        try {
                            await axios.get(`${API_BASE}/auth/user/info`);
                            clearInterval(pollInterval);
                            showQrCodeInModal.value = false;
                            showLoginModal.value = false;
                            loadUserInfo();
                            toast.success('登录成功！');
                            
                            // 登录成功后，如果有待执行的任务，自动执行
                            if (pendingTaskData.value) {
                                executePendingTask();
                            }
                        } catch (error) {
                            // 未登录，继续轮询
                        }
                    }, 2000);
                }
            } catch (error) {
                console.error('Failed to get QR code:', error);
                toast.error('获取二维码失败');
            }
        };
        
        const logout = () => {
            api.clearToken();
            userInfo.value = null;
            showLoginModal.value = false;
            pendingTaskData.value = null;
            toast.info('已退出登录');
        };
        
        const onTaskCreated = (taskId) => {
            // 可以在这里处理任务创建后的逻辑
        };
        
        const onRequireLogin = (taskData) => {
            // 保存待执行的任务数据
            pendingTaskData.value = taskData;
            showLoginModal.value = true;
        };
        
        const executePendingTask = () => {
            // 根据任务类型执行相应的操作
            if (!pendingTaskData.value) return;
            
            // 触发自定义事件通知相应组件
            const event = new CustomEvent('login-success', {
                detail: pendingTaskData.value
            });
            document.dispatchEvent(event);
            
            pendingTaskData.value = null;
        };
        
        onMounted(() => {
            api.init();
            // 检查是否已登录，加载用户信息
            if (api.getToken()) {
                loadUserInfo();
            }
            loading.value = false;
            
            // 监听登录成功事件
            document.addEventListener('login-success', (e) => {
                console.log('Login success, pending task:', e.detail);
            });
        });
        
        return {
            loading,
            userInfo,
            currentView,
            showLoginModal,
            showQrCodeInModal,
            qrCodeUrl,
            navItems,
            getQrCodeForModal,
            logout,
            onTaskCreated,
            onRequireLogin
        };
    }
};

// Create and mount app
createApp(App).mount('#app');

// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
});
