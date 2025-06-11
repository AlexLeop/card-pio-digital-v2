// Polyfill para navigator.clipboard em Edge mais antigo
if (!navigator.clipboard) {
  (navigator as any).clipboard = {
    writeText: (text: string) => {
      return new Promise((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) {
            resolve(undefined);
          } else {
            reject(new Error('Copy command failed'));
          }
        } catch (err) {
          document.body.removeChild(textArea);
          reject(err);
        }
      });
    }
  };
}

// Polyfill para Promise.allSettled se não estiver disponível
if (!Promise.allSettled) {
  (Promise as any).allSettled = (promises: Promise<any>[]) => {
    return Promise.all(
      promises.map(promise =>
        promise
          .then(value => ({ status: 'fulfilled', value }))
          .catch(reason => ({ status: 'rejected', reason }))
      )
    );
  };
}