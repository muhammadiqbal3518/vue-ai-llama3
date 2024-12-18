<script>
import Swal from "sweetalert2";
import { requestToIqbalAI, transcribeAudio } from "./utils/groq";

export default {
  data() {
    return {
      response: "",
      audioFile: null,
      audioBlob: null,
      audioUrl: null,
      isRecording: false,
      processing: false,
      mediaRecorder: null,
      audioChunks: [],
      content: "",
      chatHistory: JSON.parse(localStorage.getItem("chatHistory")) || [],
    };
  },
  // mounted() {
  //   document.addEventListener("contextmenu", this.disableContextMenu);
  //   document.addEventListener("keydown", this.disableDevToolsKeys);
  // },
  // beforeUnmount() {
  //   document.removeEventListener("contextmenu", this.disableContextMenu);
  //   document.removeEventListener("keydown", this.disableDevToolsKeys);
  // },
  methods: {
    handleFileUpload(event) {
      this.audioFile = event.target.files[0];
    },
    async sendRequest() {
      let userMessage = this.content;
      if (this.audioBlob) {
        userMessage = "Audio Message";
        this.addMessage("user", userMessage);
        try {
          this.processing = true;
          const aiResponse = await transcribeAudio(this.audioBlob);
          this.addMessage("ai", aiResponse);
        } catch (error) {
          this.addMessage("ai", "Terjadi kesalahan saat memproses audio.");
        } finally {
          this.processing = false;
        }
      } else if (this.audioFile) {
        userMessage = "Audio File";
        this.addMessage("user", userMessage);
        try {
          this.processing = true;
          const aiResponse = await transcribeAudio(this.audioFile);
          this.addMessage("ai", aiResponse);
        } catch (error) {
          this.addMessage("ai", "Terjadi kesalahan saat memproses audio.");
        } finally {
          this.processing = false;
        }
      } else if (this.content) {
        this.addMessage("user", userMessage);
        try {
          this.processing = true;
          const aiResponse = await requestToIqbalAI(this.content);
          this.addMessage("ai", aiResponse);
        } catch (error) {
          this.addMessage("ai", "Terjadi kesalahan saat memproses teks.");
        } finally {
          this.processing = false;
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Input teks atau audio tidak boleh kosong!",
        });
      }

      this.content = "";
      this.audioBlob = null;
      this.audioFile = null;
    },
    addMessage(role, text) {
      const message = {
        role,
        text,
        audioUrl: role === "user" && this.audioUrl ? this.audioUrl : null,
      };
      this.chatHistory.push(message);
      localStorage.setItem("chatHistory", JSON.stringify(this.chatHistory));
    },
    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
          this.audioUrl = URL.createObjectURL(this.audioBlob);
        };

        this.mediaRecorder.start();
        this.isRecording = true;
      } catch (error) {
        console.error("Error saat memulai rekaman:", error);
      }
    },
    stopRecording() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }
    },
    cleanChat() {
      this.response = [];
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Deleted!",
            text: "Your chat has been deleted.",
            icon: "success",
          });
          this.chatHistory = [];
          localStorage.removeItem("chatHistory");
        }
      });
    },
    // disableContextMenu(event) {
    //   event.preventDefault();
    // },
    // disableDevToolsKeys(event) {
    //   if (
    //     (event.ctrlKey && event.shiftKey && event.key === "I") || // Ctrl+Shift+I
    //     (event.ctrlKey && event.key === "U") || // Ctrl+U
    //     event.key === "F12" // F12
    //   ) {
    //     event.preventDefault();
    //   }
    // },
  },
};
</script>

<template>
  <main
    class="flex flex-col min-h-[80vh] justify-between items-center max-w-xl w-full mx-auto"
  >
    <h1 class="text-4xl text-indigo-500 mt-6">iqbalAi</h1>
    <h5 class="text-xs text-white mb-6">model Llama 3 8b</h5>

    <!-- Chat Area -->
    <div class="chat-container flex-1 w-full overflow-y-auto rounded-md p-4 mb-20">
      <div v-for="(chat, index) in chatHistory" :key="index" class="mb-4">
        <!-- User's Bubble -->
        <div v-if="chat.role === 'user'" class="flex justify-end">
          <div class="bg-green-500 text-white px-4 py-2 rounded-lg max-w-xs text-right">
            <p>{{ chat.text }}</p>
          </div>
        </div>

        <!-- AI's Bubble -->
        <div v-else class="flex justify-start">
          <pre
            v-if="chat.text"
            class="highlight p-4 bg-gray-100 rounded-md border border-gray-300"
          >
            {{ chat.text }}
          </pre>
          <audio
            v-if="chat.audioUrl"
            :src="chat.audioUrl"
            controls
            class="w-full mt-2"
          ></audio>
        </div>
      </div>
      <div v-if="chatHistory == ''" class="mb-4">
        <div class="flex justify-start">
          <div class="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs text-right">
            Apakah ada yang bisa saya bantu?
          </div>
        </div>
      </div>
      <div v-if="processing" class="mb-4">
        <div class="flex justify-start">
          <div class="text-white px-4 py-2 rounded-lg max-w-xs text-right">
            <div role="status">
              <svg
                aria-hidden="true"
                class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span class="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <form
      @submit.prevent="sendRequest"
      class="fixed bottom-0 left-0 w-full shadow-md p-2 flex items-center gap-1"
    >
      <!-- Upload Audio File -->

      <!-- Rekam Suara -->

      <!-- Input Teks -->
      <div
        @click="cleanChat"
        v-if="chatHistory != ''"
        style="cursor: pointer"
        class="bg-red-500 hover:bg-red-600 py-2 px-2 text-white font-bold rounded-md"
      >
        Del
      </div>
      <input
        v-model="content"
        type="text"
        placeholder="Masukkan perintah"
        class="flex-1 py-2 px-4 rounded-md border border-gray-300"
        :disabled="audioBlob || audioFile"
      />

      <!-- Tombol Kirim -->
      <button
        type="submit"
        :disabled="processing"
        class="bg-green-500 hover:bg-green-600 py-2 px-2 text-white font-bold rounded-md"
      >
        <div v-if="processing" role="status">...</div>
        <div v-else>Send</div>
      </button>
    </form>
  </main>
</template>

<style>
body {
  background-color: #151618;
}
.chat-container {
  height: calc(80vh - 120px);
}
.highlight {
  background-color: #282c34;
  color: #61dafb;
  font-family: "Courier New", Courier, monospace;
  padding: 10px;
  border-radius: 5px;
  white-space: pre-wrap; /* Agar respons panjang dapat membungkus teks */
  word-wrap: break-word;
}
</style>
