const fetchShortenedURL = async () => {
  const response = await fetch('/links');
  const links = await response.json();

  console.log('links', links);

  const list = document.getElementById('shortened-urls');
  list.innerHTML = '';

  for (const [sc, url] of Object.entries(links)) {
    const div = document.createElement('div');
    div.classList.add('url-card');

    const truncURL = url.length > 50 ? `${url.slice(0, 50)}...` : url;

    div.innerHTML = `
      <a href="${window.location.origin}/${sc}" target="_blank">
        ${window.location.origin}/${sc}
      </a>

      <span>→</span>

      <p class="copy-url">${truncURL}</p>
    `;

    const p = div.querySelector('.copy-url');

    p.addEventListener('click', async () => {
      const shortURL = `${window.location.origin}/${sc}`;

      await navigator.clipboard.writeText(shortURL);

      p.textContent = 'Copied! ✅';

      setTimeout(() => {
        p.textContent = truncURL;
      }, 1500);
    });

    list.appendChild(div);
  }
};

document
  .getElementById('short-form')
  .addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const url = formData.get('url');
    const sc = formData.get('shortCode');

    console.log(url, sc);

    try {
      const response = await fetch('/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, sc }),
      });

      if (response.ok) {
        fetchShortenedURL();

        alert('Form Submitted!');

        event.target.reset();
      } else {
        const errorMsg = await response.text();

        alert(errorMsg);
      }
    } catch (error) {
      console.log(error);
    }
  });

fetchShortenedURL();
