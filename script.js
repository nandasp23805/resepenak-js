import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
    "https://pcqrwkvardtgkurjugra.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXJ3a3ZhcmR0Z2t1cmp1Z3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODkyNjYsImV4cCI6MjA2NTU2NTI2Nn0.SUVJnM82j0WylXBM2Qf7WTjz17xzivwGnoxrzt3k9Uo"
)

async function simpanResep() {
    const judul = document.getElementById("judul").value;
    const alat = document.getElementById("alat").value;
    const bahan = document.getElementById("bahan").value;
    const steps = document.getElementById("steps").value;

    const { data, error } = await supabase
        .from('resepenak')
        .insert([
            { judul: judul, alat: alat, bahan: bahan, steps: steps }
        ])

    if (error) return alert("Gagal menambahkan resep: " + error.message)
    alert("Resep berhasil ditambahkan!");

    loadData();
}

async function loadData() {
  const { data, error } = await supabase.from("resepenak").select("*");
  if (error) return alert("Data gagal diambil: " + error.message);

  const container = document.getElementById("list");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center">
        <img src="image/404.jpg" alt="No Recipes" class="img-fluid mb-3" style="max-width: 250px;">
        <p class="text-muted">Tidak ada resep tersedia.</p>
      </div>
    `;
    return;
  }

  data.forEach((item) => {
    const col = document.createElement("div");
    col.className = "col";
    col.innerHTML = `
      <div class="card bg-card border border-secondary shadow">
        <div class="card-body">
          <h5 class="card-title">${item.judul}</h5>
          <p class="card-text">Alat: ${item.alat || "-"}</p>
          <p class="card-text">Bahan: ${item.bahan || "-"}</p>
          <p class="card-text">Langkah: ${item.steps || "-"}</p>
          <div class="d-flex justify-content-end mt-3">
            <button class="btn btn-outline-danger btn-sm" onclick="confirmHapus(${item.id})"
              class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm">Hapus</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}


async function confirmHapus(id) {
  const {data , error} = await supabase.from("resepenak").delete().eq("id", id);
  if (error) return alert("Gagal menghapus resep: " + error.message);
  alert("Resep berhasil dihapus!");
  loadData();
} 


window.simpanResep = simpanResep;
window.confirmHapus = confirmHapus;
loadData();