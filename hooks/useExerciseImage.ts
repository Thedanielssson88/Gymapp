import { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { storage } from '../services/storage';

export const useExerciseImage = (exercise?: Exercise) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const load = async () => {
      if (!exercise) return;

      // 1. Prioritera lokal bild (imageId)
      if (exercise.imageId) {
        const url = await storage.getImage(exercise.imageId);
        if (active && url) {
          objectUrl = url;
          setImageSrc(url);
          return;
        }
      }

      // 2. Fallback till extern URL
      if (exercise.imageUrl) {
        if (active) setImageSrc(exercise.imageUrl);
        return;
      }

      // 3. Ingen bild
      if (active) setImageSrc(null);
    };

    load();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [exercise?.id, exercise?.imageId, exercise?.imageUrl]);

  return imageSrc;
};