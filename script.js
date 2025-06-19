import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
    "https://pcqrwkvardtgkurjugra.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXJ3a3ZhcmR0Z2t1cmp1Z3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODkyNjYsImexCI6MjA2NTU2NTI2Nn0.SUVJnM82j0WylXBM2Qf7WTjz17xzivwGnoxrzt3k9Uo"
)

// Global variable to keep track of the recipe being edited
let currentEditRecipeId = null;

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

    if (currentEditRecipeId) {
        // Jika ada currentEditRecipeId, berarti ini adalah operasi UPDATE
        await updateResep(currentEditRecipeId, judul, alat, bahan, steps);
    } else {
        // Jika tidak ada, ini adalah operasi INSERT (tambah baru)
        const { data, error } = await supabase
            .from('resepenak')
            .insert([
                { judul: judul, alat: alat, bahan: bahan, steps: steps }
            ]);

        if (error) {
            console.error("Gagal menambahkan resep:", error.message);
            return alert("Gagal menambahkan resep: " + error.message);
        }
        alert("Resep berhasil ditambahkan!");
    }

    // Reset form dan mode edit
    resetForm();
    loadData(); // Memuat ulang data setelah penambahan/pembaruan
}

// Fungsi baru untuk memperbarui resep
async function updateResep(id, judul, alat, bahan, steps) {
    const { data, error } = await supabase
        .from('resepenak')
        .update({ judul: judul, alat: alat, bahan: bahan, steps: steps })
        .eq('id', id);

    if (error) {
        console.error("Gagal memperbarui resep:", error.message);
        return alert("Gagal memperbarui resep: " + error.message);
    }
    alert("Resep berhasil diperbarui!");
}

// Fungsi untuk mereset formulir dan mengubah tombol kembali ke "Simpan"
function resetForm() {
    document.getElementById("judul").value = "";
    document.getElementById("alat").value = "";
    document.getElementById("bahan").value = "";
    document.getElementById("steps").value = "";
    document.getElementById("submitButton").textContent = "Simpan"; // Ganti teks tombol
    currentEditRecipeId = null; // Reset ID resep yang diedit
    // Sembunyikan tombol batal edit jika ada
    const cancelButton = document.getElementById('cancelEditButton');
    if (cancelButton) {
        cancelButton.remove();
    }
}


// Fungsi loadData diubah agar bisa menerima searchTerm
async function loadData(searchTerm = '') { // Default searchTerm kosong
    let query = supabase.from("resepenak").select("*");

    if (searchTerm) {
        // Menggunakan .ilike untuk pencarian case-insensitive pada beberapa kolom
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
            <div class="card bg-card border border-secondary shadow h-100">
                <div class="card-body">
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

// Fungsi untuk melakukan pencarian
async function performSearch() {
    const searchDesktopInput = document.getElementById('searchDesktopInput');
    const searchMobileInput = document.getElementById('searchMobileInput');

    let searchTerm = '';
    // Dapatkan nilai dari input yang sedang terlihat/aktif
    if (searchDesktopInput && searchDesktopInput.offsetParent !== null) {
        searchTerm = searchDesktopInput.value.trim();
    } else if (searchMobileInput && searchMobileInput.offsetParent !== null) {
        searchTerm = searchMobileInput.value.trim();
    }

    // Panggil loadData dengan searchTerm. Ini akan menampilkan hasil pencarian.
    await loadData(searchTerm);

    // Pastikan halaman 'resep' ditampilkan setelah pencarian
    showPage('resep');
}

// Fungsi editResep: Mengisi form dengan data resep yang akan diedit
async function editResep(id) {
    const { data, error } = await supabase
        .from('resepenak')
        .select('*')
        .eq('id', id)
        .single(); // Gunakan .single() karena kita hanya mencari satu resep berdasarkan ID

    if (error) {
        console.error("Gagal mengambil data resep untuk diedit:", error.message);
        return alert("Gagal mengambil data resep untuk diedit: " + error.message);
    }

    // Isi formulir dengan data resep
    document.getElementById("judul").value = data.judul;
    document.getElementById("alat").value = data.alat;
    document.getElementById("bahan").value = data.bahan;
    document.getElementById("steps").value = data.steps;

    // Simpan ID resep yang sedang diedit
    currentEditRecipeId = id;

    // Ubah teks tombol simpan menjadi "Perbarui"
    document.getElementById("submitButton").textContent = "Perbarui";

    // Tambahkan tombol "Batal Edit"
    let cancelButton = document.getElementById('cancelEditButton');
    if (!cancelButton) { // Jika belum ada, buat
        cancelButton = document.createElement('button');
        cancelButton.id = 'cancelEditButton';
        cancelButton.className = 'btn btn-secondary ms-2'; // Bootstrap styling
        cancelButton.textContent = 'Batal Edit';
        cancelButton.type = 'button'; // Penting agar tidak submit form
        cancelButton.onclick = function() {
            resetForm();
            loadData(); // Memuat ulang data penuh setelah batal
        };
        document.getElementById('submitButton').parentNode.appendChild(cancelButton);
    }

    // Pastikan halaman 'resep' ditampilkan agar form terlihat
    showPage('resep');
}


// Expose functions to the global window object so HTML can call them
window.simpanResep = simpanResep;
window.confirmHapus = confirmHapus;
window.loadData = loadData; // Penting agar bisa dipanggil dari HTML atau DOMContentLoaded
window.performSearch = performSearch; // expose performSearch
window.editResep = editResep; // expose editResep
window.resetForm = resetForm; // expose resetForm

// Panggil loadData saat halaman pertama kali dimuat untuk menampilkan semua resep
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan homePage yang aktif secara default dan resepPage tersembunyi
    document.getElementById('homePage').style.display = 'flex';
    document.getElementById('resepPage').style.display = 'none';

    // Event listeners for search input (for real-time filtering or on enter)
    document.getElementById('searchDesktopInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    document.getElementById('searchMobileInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Handle form submission for adding new recipe
    const recipeForm = document.getElementById('recipeForm');
    recipeForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Mencegah halaman reload
        simpanResep();
    });

    // Panggil loadData saat halaman 'resep' dimuat pertama kali melalui navigasi
    // Ini menangani kasus di mana user mungkin langsung pergi ke halaman resep tanpa search
    // atau untuk memastikan daftar ditampilkan setelah operasi CRUD.
    // Catatan: Ini dipanggil di DOMContentLoaded jika resepPage adalah default.
    // Namun, karena 'home' adalah default, loadData akan dipanggil saat showPage('resep') aktif.
    // Jika Anda ingin menampilkan resep saat halaman 'resep' pertama kali diakses, pastikan
    // showPage('resep') dipanggil saat tombol "Tambahkan Resep" diklik.
});