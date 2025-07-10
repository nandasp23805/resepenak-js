import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://pcqrwkvardtgkurjugra.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXJ3a3ZhcmR0Z2t1cmp1Z3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODkyNjYsImV4cCI6MjA2NTU2NTI2Nn0.SUVJnM82j0WylXBM2Qf7WTjz17xzivwGnoxrzt3k9Uo"
);

let currentEditRecipeId = null;

// === Inisialisasi SQLite ===
let SQL, db;
const SQL_READY = initSqlJs({
  locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
}).then(SQLLib => {
  SQL = SQLLib;
  db = new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS resepenak (
    judul TEXT, alat TEXT, bahan TEXT, steps TEXT
  )`);

  const saved = localStorage.getItem('sqliteResepBackup');
  if (saved) {
    db = new SQL.Database(new Uint8Array(JSON.parse(saved)));
    console.log("Backup lokal SQLite dipulihkan.");
  }
});

function downloadSQLiteFile() {
  const binaryArray = db.export();
  const blob = new Blob([binaryArray], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resepenak.sqlite';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// === Fungsi CRUD ===
async function simpanResep() {
  const judul = document.getElementById("judul").value;
  const alat = document.getElementById("alat").value;
  const bahan = document.getElementById("bahan").value;
  const steps = document.getElementById("steps").value;

  if (!judul || !alat || !bahan || !steps) {
    return alert("Mohon isi semua kolom resep.");
  }

  if (currentEditRecipeId) {
    await updateResep(currentEditRecipeId, judul, alat, bahan, steps);
  } else {
    const { error } = await supabase
      .from('resepenak')
      .insert([{ judul, alat, bahan, steps }]);
    if (error) return alert("Gagal menambahkan: " + error.message);

    await SQL_READY;
    db.run("INSERT INTO resepenak (judul, alat, bahan, steps) VALUES (?, ?, ?, ?)", [judul, alat, bahan, steps]);
    const backup = db.export();
    localStorage.setItem("sqliteResepBackup", JSON.stringify(Array.from(backup)));
  }

  alert("Resep berhasil disimpan!");
  resetForm();
  loadDataResep();
  showPage('daftarResep');
}

async function updateResep(id, judul, alat, bahan, steps) {
  const { error } = await supabase
    .from('resepenak')
    .update({ judul, alat, bahan, steps })
    .eq('id', id);
  if (error) return alert("Gagal update: " + error.message);

  alert("Resep diperbarui!");
}

function resetForm() {
  document.getElementById("judul").value = "";
  document.getElementById("alat").value = "";
  document.getElementById("bahan").value = "";
  document.getElementById("steps").value = "";
  document.getElementById("submitButton").textContent = "Simpan";
  currentEditRecipeId = null;

  const cancelButton = document.getElementById('cancelEditButton');
  if (cancelButton) cancelButton.remove();
}

async function loadDataResep() {
  const container = document.getElementById("daftarResepList");
  container.innerHTML = "";

  const { data, error } = await supabase.from("resepenak").select("*").order('id', { ascending: false });
  if (error) return alert("Gagal mengambil data: " + error.message);

  if (!data.length) {
    return container.innerHTML = `<div class="text-center text-muted">Belum ada resep.</div>`;
  }

  data.forEach(item => {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4 mb-4";
    col.innerHTML = `
      <div class="card bg-light h-100">
        <div class="card-body">
          <h5 class="card-title" data-bs-toggle="collapse" data-bs-target="#collapse${item.id}" style="cursor:pointer;">
            ${item.judul}
          </h5>
          <div class="collapse" id="collapse${item.id}">
            <div class="mt-3">
              <h6>Alat:</h6><p>${item.alat}</p>
              <h6>Bahan:</h6><p>${item.bahan}</p>
              <h6>Langkah:</h6><p>${item.steps}</p>
              <div class="d-flex justify-content-end">
                <button class="btn btn-warning btn-sm me-2" onclick="editResep(${item.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmHapus(${item.id})">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

async function confirmHapus(id) {
  if (!confirm("Yakin ingin menghapus resep ini?")) return;
  const { error } = await supabase.from("resepenak").delete().eq("id", id);
  if (error) return alert("Gagal menghapus: " + error.message);

  alert("Berhasil dihapus!");
  loadDataResep();
}

async function editResep(id) {
  const { data, error } = await supabase.from("resepenak").select("*").eq("id", id).single();
  if (error) return alert("Gagal ambil data edit: " + error.message);

  document.getElementById("judul").value = data.judul;
  document.getElementById("alat").value = data.alat;
  document.getElementById("bahan").value = data.bahan;
  document.getElementById("steps").value = data.steps;
  currentEditRecipeId = id;

  document.getElementById("submitButton").textContent = "Perbarui";
  if (!document.getElementById('cancelEditButton')) {
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancelEditButton';
    cancelBtn.className = 'btn btn-secondary ms-2';
    cancelBtn.textContent = 'Batal Edit';
    cancelBtn.onclick = () => {
      resetForm();
      loadDataResep();
      showPage('daftarResep');
    };
    document.getElementById("submitButton").parentNode.appendChild(cancelBtn);
  }

  showPage('resep');
}

// === Navigasi Halaman ===
function showPage(page) {
  ['homePage', 'resepPage', 'daftarResepPage'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById(page + 'Page').style.display = 'block';

  const navbarCollapse = document.getElementById('navbarNav');
  if (navbarCollapse?.classList.contains('show')) {
    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
    if (bsCollapse) bsCollapse.hide();
  }
}

// === Inisialisasi ===
document.addEventListener("DOMContentLoaded", () => {
  showPage("home");

  document.getElementById("recipeForm").addEventListener("submit", e => {
    e.preventDefault();
    simpanResep();
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const navbarCollapse = document.getElementById('navbarNav');
      if (navbarCollapse?.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });

  document.getElementById('downloadSQLiteBtn')?.addEventListener('click', async () => {
    await SQL_READY;
    downloadSQLiteFile();
  });
});

// === Ekspor Fungsi ===
window.simpanResep = simpanResep;
window.loadDataResep = loadDataResep;
window.confirmHapus = confirmHapus;
window.editResep = editResep;
window.showPage = showPage;
window.resetForm = resetForm;
