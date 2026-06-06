import { readFile, writeFile } from 'fs/promises';
import { createServer } from 'http';
import path from 'path';
import crypto from 'crypto';

const PORT = 3120;
const DATA_FILE = path.join('data', 'links.json'); //& Our DataBase

//& READ THE html, css and js FILES
async function serveFile(filePath, contentType, res) {
  const data = await readFile(filePath);

  res.writeHead(200, {
    'Content-Type': contentType,
  });

  res.end(data);
}

const loadLinks = async () => {
  try {
    const data = await readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeFile(DATA_FILE, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};

const saveLinks = async (links) => {
  await writeFile(DATA_FILE, JSON.stringify(links));
};

//& Creating and Managing the operations in Server
const server = createServer(async (req, res) => {
  console.log(req.url);

  //& File Location for html, css and js
  const filePath = path.join(
    'public',
    req.url === '/' ? 'index.html' : req.url
  );

  //& Showing the html, css and js files
  if (req.method === 'GET') {
    try {
      if (req.url === '/') {
        return serveFile(filePath, 'text/html', res);
      }

      if (req.url === '/style.css') {
        return serveFile(filePath, 'text/css', res);
      }

      if (req.url === '/script.js') {
        return serveFile(filePath, 'application/javascript', res);
      }

      //& Send all saved links
      if (req.url === '/links') {
        const links = await loadLinks();

        res.writeHead(200, {
          'Content-Type': 'application/json',
        });

        return res.end(JSON.stringify(links));
      }

      //& REDIRECTION LOGIC
      const links = await loadLinks();
      const shortCode = req.url.slice(1);

      if (links[shortCode]) {
        res.writeHead(302, {
          Location: links[shortCode],
        });

        return res.end();
      }

      res.writeHead(404);
      res.end('Not Found');
    } catch (error) {
      console.error(error);
      res.writeHead(500);
      res.end('Server Error');
    }

    return;
  }

  //& What to do when /shorten API is called ?
  if (req.method === 'POST' && req.url === '/shorten') {
    const links = await loadLinks();

    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      console.log(body);

      const { url, sc } = JSON.parse(body);

      if (!url) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('URL is Required!');
      }

      const finalSc = sc || crypto.randomBytes(4).toString('hex');

      if (links[finalSc]) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('Short Code already Exists!');
      }

      //& Saving Format
      links[finalSc] = url;

      await saveLinks(links);

      res.writeHead(200, {
        'Content-Type': 'application/json',
      });

      res.end(
        JSON.stringify({
          success: true,
          shortCode: finalSc,
        })
      );
    });

    return;
  }

  res.writeHead(404);
  res.end('Route Not Found');
});

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
