import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://pcqrwkvardtgkurjugra.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXJ3a3ZhcmR0Z2t1cmp1Z3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODkyNjYsImV4cCI6MjA2NTU2NTI2Nn0.SUVJnM82j0WylXBM2Qf7WTjz17xzivwGnoxrzt3k9Uo"
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

    const container = document.getElementById("daftarResepList");
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
        col.className = "col-md-6 col-lg-4 mb-4";
        col.innerHTML = `
            <div class="card bg-card border border-secondary shadow h-100">
                <div class="card-body">
                    <h5 class="card-title"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseRecipe${item.id}"
                        aria-expanded="false"
                        aria-controls="collapseRecipe${item.id}"
                        style="cursor: pointer;">
                        ${item.judul}
                    </h5>
                    <div class="collapse" id="collapseRecipe${item.id}">
                        <div class="card card-body mt-3">
                            <h6>Alat:</h6>
                            <p>${item.alat || "-"}</p>
                            <h6>Bahan:</h6>
                            <p>${item.bahan || "-"}</p>
                            <h6>Langkah:</h6>
                            <p>${item.steps || "-"}</p>
                            <div class="d-flex justify-content-end mt-3">
                                <button class="btn btn-warning btn-sm me-2" onclick="editResep(${item.id})">Edit</button>
                                <button class="btn btn-outline-danger btn-sm" onclick="confirmHapus(${item.id})">Hapus</button>
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
    if (!confirm("Anda yakin ingin menghapus resep ini?")) {
        return;
    }

    const { data, error } = await supabase.from("resepenak").delete().eq("id", id);
    if (error) {
        console.error("Gagal menghapus resep:", error.message);
        return alert("Gagal menghapus resep: " + error.message);
    }
    alert("Resep berhasil dihapus!");
    loadDataResep();
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
            loadDataResep();
            showPage('daftarResep');
        };
        document.getElementById('submitButton').parentNode.appendChild(cancelButton);
    }
    showPage('resep');
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
        loadDataResep();
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
window.confirmHapus = confirmHapus; // Ini yang ditambahkan/diperbaiki
window.loadDataResep = loadDataResep;
window.editResep = editResep;     // Ini yang ditambahkan/diperbaiki
window.resetForm = resetForm;
window.showPage = showPage;