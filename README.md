# 🐺 Wolf Whiteboard

An interactive digital whiteboard with hand gesture controls, built with React, Vite, and MediaPipe. Draw naturally using hand gestures or traditional mouse/touch inputs.

![Wolf Whiteboard Demo](https://via.placeholder.com/800x450.png?text=Wolf+Whiteboard+Demo)

## ✨ Features

- **Natural Hand Gesture Control**
  - Draw in the air with your index finger
  - Precise finger tracking with MediaPipe
  - Pinch to draw gesture

- **Multiple Drawing Tools**
  - Pen with adjustable thickness and color
  - Neon pen with glow effect
  - Eraser with adjustable size

- **Intuitive UI**
  - Centered, collapsible toolbar
  - Responsive design
  - Clean, modern interface

- **Additional Features**
  - Undo/Redo functionality
  - Clear canvas
  - Save drawings as PDF
  - Toggle between camera and mouse modes

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Modern web browser with WebGL support
- Webcam (for hand tracking)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Qadirdad-Kazi/Mirror_WhiteBoard
   cd wolf-whiteboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in your browser**
   The app should be running at `http://localhost:5173`

## 🎨 Usage

### Hand Gesture Mode
1. Click the camera icon to enable camera mode
2. Allow camera access when prompted
3. Point your index finger to move the cursor
4. Pinch your thumb and index finger together to draw
5. Release to stop drawing

### Mouse/Touch Mode
1. Click the mouse icon to switch to mouse mode
2. Click and drag to draw
3. Use the toolbar to change tools and colors

### Toolbar Controls
- **Pen**: Standard drawing tool
- **Neon Pen**: Glowing effect pen
- **Eraser**: Remove parts of your drawing
- **Undo/Redo**: Step backward/forward through your actions
- **Clear**: Clear the entire canvas
- **Save**: Download your drawing as a PDF
- **Camera/Mouse Toggle**: Switch between input modes

## 🛠️ Built With

- [React](https://reactjs.org/) - Frontend library
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [MediaPipe](https://mediapipe.dev/) - Hand tracking and gesture recognition
- [jspdf](https://github.com/parallax/jsPDF) - PDF generation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to Google's MediaPipe team for the amazing hand tracking technology
- Built with create-vite
- Inspired by digital whiteboard applications
