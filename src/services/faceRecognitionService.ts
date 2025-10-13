import * as faceapi from 'face-api.js';
import { FaceRecognitionResult } from '../types/user';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

let modelsLoaded = false;

// Load face-api.js models
export const loadModels = async (): Promise<void> => {
  if (modelsLoaded) return;

  try {
    const MODEL_URL = '/models'; // You'll need to add face-api.js models to public/models
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    ]);
    
    modelsLoaded = true;
    console.log('Face recognition models loaded');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    throw new Error('Failed to load face recognition models');
  }
};

// Detect face and extract descriptor from image
export const extractFaceDescriptor = async (
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[] | null> => {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    return Array.from(detection.descriptor);
  } catch (error) {
    console.error('Error extracting face descriptor:', error);
    return null;
  }
};

// Compare two face descriptors
export const compareFaceDescriptors = (
  descriptor1: number[],
  descriptor2: number[]
): number => {
  const desc1 = new Float32Array(descriptor1);
  const desc2 = new Float32Array(descriptor2);
  
  return faceapi.euclideanDistance(desc1, desc2);
};

// Recognize face from video stream
export const recognizeFaceFromVideo = async (
  videoElement: HTMLVideoElement,
  storedDescriptor: number[],
  threshold: number = 0.6
): Promise<FaceRecognitionResult> => {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    const currentDescriptor = await extractFaceDescriptor(videoElement);
    
    if (!currentDescriptor) {
      return {
        success: false,
        error: 'No face detected',
      };
    }

    const distance = compareFaceDescriptors(currentDescriptor, storedDescriptor);
    const confidence = 1 - distance; // Convert distance to confidence (0-1)

    if (distance < threshold) {
      return {
        success: true,
        confidence,
      };
    }

    return {
      success: false,
      confidence,
      error: 'Face does not match',
    };
  } catch (error) {
    console.error('Error recognizing face:', error);
    return {
      success: false,
      error: 'Face recognition failed',
    };
  }
};

// Find user by face recognition
export const findUserByFace = async (
  videoElement: HTMLVideoElement,
  threshold: number = 0.6
): Promise<FaceRecognitionResult> => {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    const currentDescriptor = await extractFaceDescriptor(videoElement);
    
    if (!currentDescriptor) {
      return {
        success: false,
        error: 'No face detected',
      };
    }

    // Query all users with face descriptors
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    const querySnapshot = await getDocs(q);

    let bestMatch: { userId: string; confidence: number } | null = null;

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.faceDescriptor && Array.isArray(userData.faceDescriptor)) {
        const distance = compareFaceDescriptors(
          currentDescriptor,
          userData.faceDescriptor
        );
        const confidence = 1 - distance;

        if (distance < threshold) {
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = {
              userId: doc.id,
              confidence,
            };
          }
        }
      }
    });

    if (bestMatch) {
      return {
        success: true,
        userId: bestMatch.userId,
        confidence: bestMatch.confidence,
      };
    }

    return {
      success: false,
      error: 'No matching user found',
    };
  } catch (error) {
    console.error('Error finding user by face:', error);
    return {
      success: false,
      error: 'Face recognition failed',
    };
  }
};

// Capture image from video stream
export const captureImageFromVideo = (
  videoElement: HTMLVideoElement
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.drawImage(videoElement, 0, 0);
  }
  
  return canvas;
};

// Start video stream from camera
export const startVideoStream = async (
  videoElement: HTMLVideoElement
): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false,
    });
    
    videoElement.srcObject = stream;
    
    return stream;
  } catch (error) {
    console.error('Error starting video stream:', error);
    throw new Error('Failed to access camera');
  }
};

// Stop video stream
export const stopVideoStream = (stream: MediaStream): void => {
  stream.getTracks().forEach((track) => track.stop());
};
