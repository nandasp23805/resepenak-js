import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://pcqrwkvardtgkurjugra.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXJ3a3ZhcmR0Z2t1cmp1Z3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODkyNjYsImexBGUxMjY1NTY1MjY2fQ.SUVJnM82j0WylXBM2Qf7WTjz17xzivwGnoxrzt3k9Uo"
);

let currentEditRecipeId = null;

// --- Definisi Fungsi ---

async function simpanResep() {
    const judul = document.getElementById("judul").value;
    const alat = document.getElementById("alat").value;
    const bahan = document.getElementById("bahan").value;
    const steps = document.getElementById("steps").value;

    if (!judul || !alat || !bahan || !steps) {
        alert("Mohon isi semua kolom resep.");
        return;
    }

    if (currentEditRecipeId) {
        await updateResep(currentEditRecipeId, judul, alat, bahan, steps);
    } else {
        const { data, error } = await supabase
            .from('resepenak')
            .insert([{ judul: judul, alat: alat, bahan: bahan, steps: steps }]);

        if (error) {
            console.error("Gagal menambahkan resep:", error.message);
            return alert("Gagal menambahkan resep: " + error.message);
        }
        alert("Resep berhasil ditambahkan!");
    }

    resetForm();
    loadDataResep();
    showPage('daftarResep');
}

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

function resetForm() {
    document.getElementById("judul").value = "";
    document.getElementById("alat").value = "";
    document.getElementById("bahan").value = "";
    document.getElementById("steps").value = "";
    document.getElementById("submitButton").textContent = "Simpan";
    currentEditRecipeId = null;
    const cancelButton = document.getElementById('cancelEditButton');
    if (cancelButton) {
        cancelButton.remove();
    }
}

async function loadDataResep() {
    let query = supabase.from("resepenak").select("*");
    const { data, error } = await query.order('id', { ascending: false });

    if (error) {
        console.error("Data gagal diambil:", error.message);
        return alert("Data gagal diambil: " + error.message);
    }

    const daftarResepList = document.getElementById("daftarResepList");
    daftarResepList.innerHTML = ""; // Kosongkan daftar sebelumnya

    // Sembunyikan detail card dan tampilkan "belum dipilih" saat load
    document.getElementById('detailResepCard').style.display = 'none';
    document.getElementById('noRecipeSelected').style.display = 'block';

    if (data.length === 0) {
        daftarResepList.innerHTML = `
            <div class="text-center p-4">
                <img src="image/404.jpg" alt="No Recipes" class="img-fluid mb-3" style="max-width: 150px;">
                <p class="text-muted">Tidak ada resep yang ditemukan.</p>
            </div>
        `;
        return;
    }

    data.forEach((item) => {
        const listItem = document.createElement("a");
        listItem.href = "#"; // Mencegah reload halaman
        listItem.className = "list-group-item list-group-item-action";
        listItem.innerHTML = `${item.judul}`;
        // Tambahkan event listener untuk menampilkan detail saat diklik
        listItem.onclick = () => showRecipeDetail(item);
        daftarResepList.appendChild(listItem);
    });
}

// Fungsi baru untuk menampilkan detail resep di panel kanan
function showRecipeDetail(recipe) {
    const detailCard = document.getElementById('detailResepCard');
    const noRecipeSelected = document.getElementById('noRecipeSelected');

    // Sembunyikan pesan "belum dipilih" dan tampilkan detail card
    noRecipeSelected.style.display = 'none';
    detailCard.style.display = 'block';

    // Isi data ke elemen-elemen detail
    document.getElementById('detailJudul').textContent = recipe.judul;
    document.getElementById('detailAlat').textContent = recipe.alat || "-";
    document.getElementById('detailBahan').textContent = recipe.bahan || "-";
    document.getElementById('detailSteps').textContent = recipe.steps || "-";

    // Atur tombol Edit dan Hapus pada detail card
    const editBtn = document.getElementById('editDetailButton');
    const hapusBtn = document.getElementById('hapusDetailButton');

    editBtn.onclick = () => editResep(recipe.id);
    hapusBtn.onclick = () => confirmHapus(recipe.id);

    // Tambahkan animasi (misal: fade-in)
    detailCard.classList.remove('fade-out');
    detailCard.classList.add('fade-in');

    // Hapus kelas animasi setelah selesai agar bisa di-trigger lagi
    detailCard.addEventListener('animationend', () => {
        detailCard.classList.remove('fade-in');
    }, { once: true });
}

async function confirmHapus(id) {
    if (!confirm("Anda yakin ingin menghapus resep ini?")) {
        return;
    }

    const { data, error } = await supabase.from("resepenak").delete().eq("id", id);
    if (error) {
        console.error("Gagal menghapus resep:", error.message);
        return alert("Gagal menghapus resep: " + error.message);
    }
    alert("Resep berhasil dihapus!");
    loadDataResep(); // Muat ulang daftar setelah hapus
}

async function editResep(id) {
    const { data, error } = await supabase
        .from('resepenak')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Gagal mengambil data resep untuk diedit:", error.message);
        return alert("Gagal mengambil data resep untuk diedit: " + error.message);
    }

    document.getElementById("judul").value = data.judul;
    document.getElementById("alat").value = data.alat;
    document.getElementById("bahan").value = data.bahan;
    document.getElementById("steps").value = data.steps;

    currentEditRecipeId = id;
    document.getElementById("submitButton").textContent = "Perbarui";

    let cancelButton = document.getElementById('cancelEditButton');
    if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.id = 'cancelEditButton';
        cancelButton.className = 'btn btn-secondary ms-2';
        cancelButton.textContent = 'Batal Edit';
        cancelButton.type = 'button';
        cancelButton.onclick = function() {
            resetForm();
            // showPage('daftarResep'); // Tetap di daftar resep setelah batal edit
        };
        document.getElementById('submitButton').parentNode.appendChild(cancelButton);
    }
    showPage('resep'); // Pindah ke halaman tambah resep untuk edit
}

// --- Navigasi Halaman dan Inisialisasi ---

function showPage(page) {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('resepPage').style.display = 'none';
    document.getElementById('daftarResepPage').style.display = 'none';

    if (page === 'home') {
        document.getElementById('homePage').style.display = 'flex';
    } else if (page === 'resep') {
        document.getElementById('resepPage').style.display = 'block';
        resetForm();
    } else if (page === 'daftarResep') {
        document.getElementById('daftarResepPage').style.display = 'block';
        loadDataResep(); // Selalu panggil loadDataResep saat masuk halaman daftar resep
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showPage('home');

    const recipeForm = document.getElementById('recipeForm');
    if (recipeForm) {
        recipeForm.addEventListener('submit', function(event) {
            event.preventDefault();
            simpanResep();
        });
    }
});

// --- Memaparkan fungsi ke objek window agar bisa dipanggil dari HTML ---
window.simpanResep = simpanResep;
window.confirmHapus = confirmHapus;
window.loadDataResep = loadDataResep; // Biarkan ini, mungkin ada elemen lain yang memanggilnya
window.editResep = editResep;
window.resetForm = resetForm;
window.showPage = showPage;
window.showRecipeDetail = showRecipeDetail; // Penting: Ekspos fungsi baru ini