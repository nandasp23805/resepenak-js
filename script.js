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

    // Tambahkan validasi sederhana untuk memastikan semua field terisi
    if (!judul || !alat || !bahan || !steps) {
        alert("Mohon isi semua kolom resep.");
        return;
    }

    const { data, error } = await supabase
        .from('resepenak')
        .insert([
            { judul: judul, alat: alat, bahan: bahan, steps: steps }
        ])

    if (error) {
        console.error("Gagal menambahkan resep:", error.message);
        return alert("Gagal menambahkan resep: " + error.message);
    }
    alert("Resep berhasil ditambahkan!");
    // Kosongkan form setelah berhasil disimpan
    document.getElementById("judul").value = "";
    document.getElementById("alat").value = "";
    document.getElementById("bahan").value = "";
    document.getElementById("steps").value = "";

    loadData(); // Memuat ulang data setelah penambahan
}

// Fungsi loadData diubah agar bisa menerima searchTerm
async function loadData(searchTerm = '') { // Default searchTerm kosong
    let query = supabase.from("resepenak").select("*");

    if (searchTerm) {
        // Menggunakan .ilike untuk pencarian case-insensitive pada beberapa kolom
        // Anda bisa memilih kolom mana saja yang ingin dicari
        query = query.or(`judul.ilike.%${searchTerm}%,alat.ilike.%${searchTerm}%,bahan.ilike.%${searchTerm}%,steps.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.order('id', { ascending: false }); // Urutkan berdasarkan ID terbaru di atas
    if (error) {
        console.error("Data gagal diambil:", error.message);
        return alert("Data gagal diambil: " + error.message);
    }

    const container = document.getElementById("list");
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <img src="image/404.jpg" alt="No Recipes" class="img-fluid mb-3" style="max-width: 250px;">
                <p class="text-muted">Tidak ada resep yang ditemukan.</p>
            </div>
        `;
        return;
    }

    data.forEach((item) => {
        const col = document.createElement("div");
        col.className = "col-md-4 mb-4"; // Tambahkan class Bootstrap untuk grid
        col.innerHTML = `
            <div class="card bg-card border border-secondary shadow h-100"> <div class="card-body">
                    <h5 class="card-title">${item.judul}</h5>
                    <p class="card-text"><strong>Alat:</strong> ${item.alat || "-"}</p>
                    <p class="card-text"><strong>Bahan:</strong> ${item.bahan || "-"}</p>
                    <p class="card-text"><strong>Langkah:</strong> ${item.steps || "-"}</p>
                    <div class="d-flex justify-content-end mt-3">
                        <button class="btn btn-warning btn-sm me-2" onclick="editResep(${item.id})">Edit</button>
                        <button class="btn btn-outline-danger btn-sm" onclick="confirmHapus(${item.id})">Hapus</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

async function confirmHapus(id) {
    if (!confirm("Anda yakin ingin menghapus resep ini?")) {
        return; // Batalkan jika pengguna tidak yakin
    }

    const { data, error } = await supabase.from("resepenak").delete().eq("id", id);
    if (error) {
        console.error("Gagal menghapus resep:", error.message);
        return alert("Gagal menghapus resep: " + error.message);
    }
    alert("Resep berhasil dihapus!");
    loadData(); // Memuat ulang data setelah penghapusan
}

// Fungsi baru untuk melakukan pencarian
async function performSearch() {
    const searchDesktopInput = document.getElementById('searchDesktopInput');
    const searchMobileInput = document.getElementById('searchMobileInput');

    let searchTerm = '';
    // Mendapatkan nilai dari input yang sedang terlihat/aktif
    if (searchDesktopInput && searchDesktopInput.offsetParent !== null) {
        searchTerm = searchDesktopInput.value.trim();
    } else if (searchMobileInput && searchMobileInput.offsetParent !== null) {
        searchTerm = searchMobileInput.value.trim();
    }

    // Panggil loadData dengan searchTerm
    await loadData(searchTerm);

    // Pastikan halaman 'resep' ditampilkan setelah pencarian
    showPage('resep');
}

// Fungsi editResep (placeholder, perlu diimplementasikan lebih lanjut)
async function editResep(id) {
    alert(`Fungsi edit untuk resep ID: ${id} akan datang!`);
    // Anda akan mengambil data resep berdasarkan ID dari Supabase, mengisi formulir,
    // dan memiliki fungsi simpan terpisah untuk memperbarui data
}


// Expose functions to the global window object so HTML can call them
window.simpanResep = simpanResep;
window.confirmHapus = confirmHapus;
window.loadData = loadData; // Penting agar bisa dipanggil dari HTML atau DOMContentLoaded
window.performSearch = performSearch; // expose performSearch
window.editResep = editResep; // expose editResep

// Panggil loadData saat halaman pertama kali dimuat untuk menampilkan semua resep
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan Anda memanggil loadData() hanya jika halaman resep adalah halaman default
    // atau jika Anda berpindah ke halaman resep.
    // Jika halaman 'home' adalah default, panggil loadData() saat showPage('resep') dipanggil.
    // Untuk saat ini, kita panggil saat DOMContentLoaded agar resep langsung terlihat jika elemen list ada.
    loadData();
});