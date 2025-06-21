import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    "https://pcqrwkvardtgkurjugra.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXJ3a3ZhcmR0Z2t1cmp1Z3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODkyNjYsImV4cCI6MjA2NTU2NTI2Nn0.SUVJnM82j0ylXBM2Qf7WTjz17xzivwGnoxrzt3k9Uo"
);

let currentEditRecipeId = null;

// --- Definisi Fungsi ---

async function simpanResep() {
    console.log("simpanResep() called.");
    const judul = document.getElementById("judul").value;
    const alat = document.getElementById("alat").value;
    const bahan = document.getElementById("bahan").value;
    const steps = document.getElementById("steps").value;

    if (!judul || !alat || !bahan || !steps) {
        alert("Mohon isi semua kolom resep.");
        return;
    }

    if (currentEditRecipeId) {
        console.log("Updating recipe with ID:", currentEditRecipeId);
        await updateResep(currentEditRecipeId, judul, alat, bahan, steps);
    } else {
        console.log("Adding new recipe.");
        const { data, error } = await supabase
            .from('resepenak')
            .insert([{ judul: judul, alat: alat, bahan: bahan, steps: steps }]);

        if (error) {
            console.error("Failed to add recipe:", error.message);
            return alert("Gagal menambahkan resep: " + error.message);
        }
        alert("Resep berhasil ditambahkan!");
    }

    resetForm();
    loadDataResep();
    showPage('daftarResep');
}

async function updateResep(id, judul, alat, bahan, steps) {
    console.log("updateResep() called for ID:", id);
    const { data, error } = await supabase
        .from('resepenak')
        .update({ judul: judul, alat: alat, bahan: bahan, steps: steps })
        .eq('id', id);

    if (error) {
        console.error("Failed to update recipe:", error.message);
        return alert("Gagal memperbarui resep: " + error.message);
    }
    alert("Resep berhasil diperbarui!");
}

function resetForm() {
    console.log("resetForm() called.");
    document.getElementById("judul").value = "";
    document.getElementById("alat").value = "";
    document.getElementById("bahan").value = "";
    document.getElementById("steps").value = "";
    document.getElementById("submitButton").textContent = "Simpan";
    currentEditRecipeId = null;
    const cancelButton = document.getElementById('cancelEditButton');
    if (cancelButton) {
        cancelButton.remove();
        console.log("Cancel Edit button removed.");
    }
}

async function loadDataResep() {
    console.log("loadDataResep() called. Loading data from Supabase...");
    let query = supabase.from("resepenak").select("*");
    const { data, error } = await query.order('id', { ascending: false });

    if (error) {
        console.error("Failed to fetch data:", error.message);
        return alert("Data gagal diambil: " + error.message + ". Pastikan koneksi Supabase dan RLS Policy sudah benar.");
    }

    console.log("Recipe data fetched successfully:", data);

    const container = document.getElementById("daftarResepList");
    if (!container) {
        console.error("Element #daftarResepList not found!");
        return;
    }
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <img src="image/404.jpg" alt="No Recipes" class="img-fluid mb-3" style="max-width: 250px;">
                <p class="text-muted">Tidak ada resep yang ditemukan.</p>
            </div>
        `;
        console.log("No recipes found. Displaying 'No Recipes' message.");
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

    const collapseElements = container.querySelectorAll('.collapse');
    collapseElements.forEach(collapseEl => {
        const bsCollapse = new bootstrap.Collapse(collapseEl, { toggle: false });

        if (window.innerWidth >= 768) {
            bsCollapse.show(); // Di desktop, buka collapse secara default
        } else {
            bsCollapse.hide(); // Di mobile, sembunyikan collapse secara default
        }
    });
    console.log("Recipes rendered. Collapse state set based on screen width.");
}

async function confirmHapus(id) {
    console.log("confirmHapus() called for ID:", id);
    if (!confirm("Anda yakin ingin menghapus resep ini?")) {
        return;
    }

    const { data, error } = await supabase.from("resepenak").delete().eq("id", id);
    if (error) {
        console.error("Failed to delete recipe:", error.message);
        return alert("Gagal menghapus resep: " + error.message);
    }
    alert("Resep berhasil dihapus!");
    loadDataResep();
}

async function editResep(id) {
    console.log("--- editResep() called for ID:", id, "---");
    const { data, error } = await supabase
        .from('resepenak')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Failed to fetch recipe data for editing:", error.message);
        return alert("Gagal mengambil data resep untuk diedit: " + error.message);
    }
    console.log("Recipe data fetched successfully for editing:", data);

    // Panggil showPage('resep') *SEBELUM* mengisi form, ini penting!
    showPage('resep');
    console.log("Navigated to 'resep' page. Current display of #resepPage:", document.getElementById('resepPage').style.display);

    // Isi formulir dengan data yang diambil
    const judulInput = document.getElementById("judul");
    const alatInput = document.getElementById("alat");
    const bahanInput = document.getElementById("bahan");
    const stepsInput = document.getElementById("steps");
    const submitButton = document.getElementById("submitButton");

    if (judulInput) { judulInput.value = data.judul; console.log("Judul set:", data.judul); }
    else { console.warn("Element #judul not found!"); }
    
    if (alatInput) { alatInput.value = data.alat; console.log("Alat set:", data.alat); }
    else { console.warn("Element #alat not found!"); }
    
    if (bahanInput) { bahanInput.value = data.bahan; console.log("Bahan set:", data.bahan); }
    else { console.warn("Element #bahan not found!"); }
    
    if (stepsInput) { stepsInput.value = data.steps; console.log("Steps set:", data.steps); }
    else { console.warn("Element #steps not found!"); }

    if (submitButton) {
        submitButton.textContent = "Perbarui";
        console.log("Submit button text set to 'Perbarui'.");
    } else {
        console.warn("Element #submitButton not found!");
    }

    currentEditRecipeId = id;

    let cancelButton = document.getElementById('cancelEditButton');
    if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.id = 'cancelEditButton';
        cancelButton.className = 'btn btn-secondary ms-2';
        cancelButton.textContent = 'Batal Edit';
        cancelButton.type = 'button';
        cancelButton.onclick = function() {
            console.log("Cancel Edit button clicked.");
            resetForm();
            loadDataResep();
            showPage('daftarResep');
        };
        if (submitButton && submitButton.parentNode) {
            submitButton.parentNode.appendChild(cancelButton);
            console.log("Cancel Edit button appended.");
        } else {
            console.warn("Submit button or its parent not found to append cancel button.");
        }
    }
    console.log("--- editResep() finished. Form should be populated. ---");
}

// --- Navigasi Halaman dan Inisialisasi ---

function showPage(page) {
    console.log(`showPage('${page}') called.`);
    
    const homePage = document.getElementById('homePage');
    const resepPage = document.getElementById('resepPage');
    const daftarResepPage = document.getElementById('daftarResepPage');

    // Sembunyikan semua halaman
    if (homePage) homePage.style.display = 'none';
    if (resepPage) resepPage.style.display = 'none';
    if (daftarResepPage) daftarResepPage.style.display = 'none';

    // Hapus semua kelas penanda halaman dari body
    document.body.classList.remove('home-page', 'resep-page', 'daftar-resep-page');

    // Tampilkan halaman yang diminta dan tambahkan kelas ke body
    if (page === 'home') {
        if (homePage) homePage.style.display = 'flex';
        document.body.classList.add('home-page');
    } else if (page === 'resep') {
        if (resepPage) resepPage.style.display = 'block'; // Penting: Gunakan 'block' untuk form
        document.body.classList.add('resep-page');
        // JANGAN resetForm() di sini. Ini ditangani saat navigasi dari navbar
        // atau saat editResep memanggil showPage('resep')
    } else if (page === 'daftarResep') {
        if (daftarResepPage) daftarResepPage.style.display = 'block'; // Penting: Gunakan 'block'
        document.body.classList.add('daftar-resep-page');
        loadDataResep(); // Panggil loadDataResep setiap kali halaman daftar resep ditampilkan
    }
    console.log(`Display state: homePage=${homePage?.style.display}, resepPage=${resepPage?.style.display}, daftarResepPage=${daftarResepPage?.style.display}`);


    // Tutup navbar di mobile setelah navigasi
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) {
            bsCollapse.hide();
            console.log("Navbar collapsed.");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initializing app.");
    showPage('home'); // Tampilkan halaman home saat pertama kali dimuat

    const recipeForm = document.getElementById('recipeForm');
    if (recipeForm) {
        recipeForm.addEventListener('submit', function(event) {
            event.preventDefault();
            simpanResep();
        });
        console.log("Recipe form submit listener attached.");
    }

    // Menangani klik link Navbar
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const pageTarget = event.target.getAttribute('onclick'); // Mengambil onclick attribute
            if (pageTarget && pageTarget.includes("showPage('resep')")) {
                console.log("Navbar link 'Tambahkan Resep' clicked. Resetting form.");
                resetForm(); // Reset form hanya ketika menuju Tambah Resep dari navbar
            }
            // showPage akan dipanggil oleh atribut onclick di HTML Anda, jadi tidak perlu panggil lagi di sini.
        });
        console.log(`Navbar link '${link.textContent.trim()}' listener attached.`);
    });
});

// --- Memaparkan fungsi ke objek window agar bisa dipanggil dari HTML ---
window.simpanResep = simpanResep;
window.confirmHapus = confirmHapus;
window.loadDataResep = loadDataResep;
window.editResep = editResep;
window.resetForm = resetForm;
window.showPage = showPage;