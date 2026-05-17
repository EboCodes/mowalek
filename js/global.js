/* global.js — MOCESCOD Firebase edition */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, setDoc, deleteDoc, doc, query, orderBy }
  from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
/* Cloudinary handles image storage — Firebase Storage not used */

const firebaseConfig = {
  apiKey: "AIzaSyAbrxCEdXkcJbxRDqS4fT1Ionu1zFX9V-E",
  authDomain: "mowalek-304fa.firebaseapp.com",
  projectId: "mowalek-304fa",
  storageBucket: "mowalek-304fa.firebasestorage.app",
  messagingSenderId: "944386798115",
  appId: "1:944386798115:web:bc78926bf2f1768a57b796"
};

const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const auth    = getAuth(app);
/* Cloudinary config */
const CLOUDINARY_CLOUD = 'dlzif0t1k';
const CLOUDINARY_PRESET = 'mocescod_unsigned'; /* create a free unsigned upload preset in your Cloudinary dashboard */

/* ── NAV SCROLL ── */
(function () {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('raised', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── MOBILE BURGER ── */
(function () {
  const burger = document.getElementById('nav-burger');
  const drawer = document.getElementById('nav-drawer');
  if (!burger || !drawer) return;
  burger.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    const spans = burger.querySelectorAll('span');
    spans[0].style.transform = open ? 'rotate(45deg) translate(4px,4px)' : '';
    spans[1].style.opacity   = open ? '0' : '';
    spans[2].style.transform = open ? 'rotate(-45deg) translate(4px,-4px)' : '';
  });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    drawer.classList.remove('open');
    burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }));
})();

/* ── ACTIVE NAV ── */
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-drawer a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || href.endsWith(page) || (page === 'index.html' && href === './'))
      a.classList.add('active');
  });
})();

var MC = window.MC = window.MOCESCOD = {};
MC.db      = db;
MC.auth    = auth;
MC.login  = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
MC.logout = () => signOut(auth);
MC.onAuth = (cb) => onAuthStateChanged(auth, cb);

/**
 * Upload a File object to Cloudinary.
 * Requires a free unsigned upload preset named 'mocescod_unsigned'
 * created at: cloudinary.com → Settings → Upload → Upload Presets → Add
 * @param {File} file
 * @param {string} folder  - Cloudinary folder e.g. 'posts', 'programs', 'gallery'
 * @param {function} onProgress - Optional callback(percent 0–100)
 * @returns {Promise<string>} Resolves with the secure Cloudinary URL
 */
MC.uploadImage = (file, folder = 'uploads', onProgress = null) => {
  return new Promise((resolve, reject) => {
    const url  = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_PRESET);
    form.append('folder', `mocescod/${folder}`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (onProgress) {
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
};

MC.formatDate = iso =>
  new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

MC.excerpt = (html, maxLen = 140) => {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  const t = d.textContent || '';
  return t.length > maxLen ? t.slice(0, maxLen).trimEnd() + '…' : t;
};

/* ── POSTS ── */
MC.getPosts = async (category) => {
  try {
    const q = query(collection(db, 'posts'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    let posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (category && category !== 'all') posts = posts.filter(p => p.category === category);
    return posts;
  } catch (e) { console.error('getPosts:', e); return []; }
};

MC.getPost = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'posts', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) { console.error('getPost:', e); return null; }
};

MC.savePost = async (post) => {
  try {
    if (post.id) {
      const { id, ...data } = post;
      await setDoc(doc(db, 'posts', id), data, { merge: true });
      return post;
    } else {
      post.date = post.date || new Date().toISOString();
      const ref = await addDoc(collection(db, 'posts'), post);
      return { ...post, id: ref.id };
    }
  } catch (e) { console.error('savePost:', e); throw e; }
};

MC.deletePost = async (id) => {
  try { await deleteDoc(doc(db, 'posts', id)); }
  catch (e) { console.error('deletePost:', e); throw e; }
};

/* ── PROGRAMS ── */
MC.getPrograms = async () => {
  try {
    const q = query(collection(db, 'programs'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error('getPrograms:', e); return []; }
};

MC.saveProgram = async (prog) => {
  try {
    if (prog.id) {
      const { id, ...data } = prog;
      await setDoc(doc(db, 'programs', id), data, { merge: true });
      return prog;
    } else {
      prog.order = prog.order || Date.now();
      const ref = await addDoc(collection(db, 'programs'), prog);
      return { ...prog, id: ref.id };
    }
  } catch (e) { console.error('saveProgram:', e); throw e; }
};

MC.deleteProgram = async (id) => {
  try { await deleteDoc(doc(db, 'programs', id)); }
  catch (e) { throw e; }
};

/* ── GALLERY ── */
MC.getGallery = async () => {
  try {
    const q = query(collection(db, 'gallery'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error('getGallery:', e); return []; }
};

MC.saveGalleryItem = async (item) => {
  try {
    if (item.id) {
      const { id, ...data } = item;
      await setDoc(doc(db, 'gallery', id), data, { merge: true });
      return item;
    } else {
      item.date = item.date || new Date().toISOString();
      const ref = await addDoc(collection(db, 'gallery'), item);
      return { ...item, id: ref.id };
    }
  } catch (e) { console.error('saveGalleryItem:', e); throw e; }
};

MC.deleteGalleryItem = async (id) => {
  try { await deleteDoc(doc(db, 'gallery', id)); }
  catch (e) { throw e; }
};

/* ── VOLUNTEERS ── */
MC.getVolunteers = async () => {
  try {
    const q = query(collection(db, 'volunteers'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error('getVolunteers:', e); return []; }
};

MC.saveVolunteer = async (vol) => {
  try {
    vol.date = vol.date || new Date().toISOString();
    vol.status = vol.status || 'pending';
    const ref = await addDoc(collection(db, 'volunteers'), vol);
    return { ...vol, id: ref.id };
  } catch (e) { console.error('saveVolunteer:', e); throw e; }
};

MC.updateVolunteer = async (id, data) => {
  try { await setDoc(doc(db, 'volunteers', id), data, { merge: true }); }
  catch (e) { throw e; }
};

MC.deleteVolunteer = async (id) => {
  try { await deleteDoc(doc(db, 'volunteers', id)); }
  catch (e) { throw e; }
};

/* ── RENDER BLOG CARD ── */
MC.renderCard = (post, basePath = '') => {
  const img     = post.image || 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=80';
  const cat     = post.category || 'News';
  const excerpt = post.excerpt || MC.excerpt(post.content, 120);
  const date    = MC.formatDate(post.date);
  const href    = basePath + 'blog-posts.html?id=' + post.id;
  return `<a class="post-card" href="${href}">
    <div class="post-card-wrap"><img class="post-card-img" src="${img}" alt="${post.title}" loading="lazy"></div>
    <div class="post-card-meta"><span class="post-card-cat">${cat}</span><span>·</span><span>${date}</span></div>
    <h3>${post.title}</h3>
    <p>${excerpt}</p>
  </a>`;
};

/* ── SEED DEMO DATA ── */
MC.seedIfEmpty = async () => {
  try {
    const posts = await MC.getPosts();
    if (posts.length > 0) return;
    const demos = [
      {
        title: "MOCESCOD Launches New Skills Training for Youth in Ogun State",
        category: "News",
        excerpt: "Over 200 young people benefited from our latest vocational skills programme in collaboration with local government.",
        content: "<p>MOCESCOD recently concluded a successful two-week vocational skills training programme in Ogun State, equipping over 200 youth with practical skills in tailoring, carpentry, and digital literacy.</p><p>The programme, funded through community partnerships, aims to reduce youth unemployment and empower participants to start their own small businesses.</p>",
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=80",
        date: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        title: "Community Health Outreach: 500 Families Reached in Rural Communities",
        category: "Programs",
        excerpt: "Our mobile health clinic visited 12 communities, providing free screenings, medications and maternal health support.",
        content: "<p>In partnership with local health workers, MOCESCOD's mobile health outreach programme reached over 500 families across 12 rural communities this quarter.</p><p>Services included free malaria testing, blood pressure screening, ante-natal consultations and distribution of essential medications.</p>",
        image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80",
        date: new Date(Date.now() - 7 * 86400000).toISOString()
      },
      {
        title: "Annual Report 2024: Building Sustainable Communities Together",
        category: "Reports",
        excerpt: "Read our annual report highlighting key milestones, impact numbers and plans for 2025 and beyond.",
        content: "<p>2024 was a landmark year for MOCESCOD. We expanded our reach to three new states, supported over 1,200 families and launched four new community development programmes.</p><p>Our annual report details the impact, partnerships and financial transparency that guide everything we do.</p>",
        image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&q=80",
        date: new Date(Date.now() - 14 * 86400000).toISOString()
      }
    ];
    for (const d of demos) await addDoc(collection(db, 'posts'), d);
    const progDemos = [
      { title: "Youth Empowerment", description: "Vocational training, entrepreneurship coaching and mentorship for young Nigerians aged 18–35.", icon: "🎓", order: 1, image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=700&q=80" },
      { title: "Community Health", description: "Mobile health clinics, maternal care support and health education for underserved rural communities.", icon: "🏥", order: 2, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&q=80" },
      { title: "Education Support", description: "Scholarships, school supplies and after-school tutoring to keep children in school.", icon: "📚", order: 3, image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&q=80" },
      { title: "Food Security", description: "Agricultural training, seed support and market linkages for smallholder farming families.", icon: "🌱", order: 4, image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=700&q=80" }
    ];
    for (const p of progDemos) await addDoc(collection(db, 'programs'), p);
    const galleryDemos = [
      { title: "Skills Training Workshop 2024", url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80", date: new Date().toISOString() },
      { title: "Health Outreach Programme", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80", date: new Date().toISOString() },
      { title: "Community Farmers Market", url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80", date: new Date().toISOString() },
      { title: "Children Education Drive", url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80", date: new Date().toISOString() },
      { title: "Annual Stakeholders Meeting", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", date: new Date().toISOString() },
      { title: "Rural Women Cooperative", url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80", date: new Date().toISOString() }
    ];
    for (const g of galleryDemos) await addDoc(collection(db, 'gallery'), g);
  } catch (e) { console.error('seedIfEmpty:', e); }
};

/* ── EXPORT ── */
export { MC };