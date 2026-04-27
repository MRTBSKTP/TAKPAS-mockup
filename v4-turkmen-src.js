let geojsonData = null; // Lazy yükleme için placeholder - WFS Simülasyonu

// --------------------------------------------------
// Aydın Kuşadası Türkmen veri setinde Name özniteliği
// her bir detay için özel ve farklı bu sebeple
// mükerrer veri kontrolü için KeyID ile birlikte 
// kullanılabilir.
// --------------------------------------------------

async function loadGeoJSON() {
    const res = await fetch("data/kadastro_ve_tapu_veri_wfs.geojson");
    geojsonData = await res.json();
    console.log("GeoJSON hazır:", geojsonData);
    // Sorgula düğmesini aktive et
    document.getElementById("parselSorgula").disabled = false;
}

// Sayfa yüklenince parsel geometrilerini çağır
loadGeoJSON();

// ==========================
// BASE MAPS
// ==========================

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 20,
    ext: 'jpg',
});

// stadia: 'https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}'
// attr:'&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

osm.setZIndex(1);
satellite.setZIndex(1);

// ==========================
// MAP INIT
// ==========================

// TR Merkez için 
// center: [34.135, 39.610]
// zoom: 5
const map = L.map('map', {
    center: [37.8297, 27.3149], // kuşadası türkmen veri bölgesi 
    zoom: 16,
    layers: [satellite] // açılışta uydu
});

// leaflet.draw için gerekli kodlar
// Çizilen objeleri tutacak layer
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
// Çizim kontrolü
const drawControl = new L.Control.Draw({
    draw: {
        polygon: true,
        rectangle: false,
        circle: false,
        marker: true,
        polyline: false,
        circlemarker: false
    },
    edit: {
        featureGroup: drawnItems,
        edit: false,
        remove: false
    }
});

map.addControl(drawControl);

// ==========================
// LAYER PLACEHOLDERS
// ==========================

// Açıklama: 
// Leaflet'te her bir detay geoemtrisi ayrı ayrı "Layer" nesnesidir, 
// bunları "LayerGroup" nesnelerinde gruplayarak katman mantığını 
// işletebiliriz.

let wmsLayer = L.layerGroup();

// megsisLayer katmanında çizilen geometrilere iterasyon ile ulaşmak için
// layerGroup yerine aşağıdaki şekilde tanımladık.
let megsisLayer = L.geoJSON(null, {


    style: function (feature) {
        return feature._style || {
            color: "yellow",
            weight: 3,
            fillOpacity: 0.0,
            dashArray: '10, 8'
        };
    },

    onEachFeature: function (feature, layer) {
        const props = feature.properties;
        const etiket = props.Name;

        layer.bindTooltip(etiket, {
            permanent: true,
            direction: "center",
            className: "WFSLabel"
        });
    }
});
megsisLayer.addTo(map);

// Bu setZIndex komutları pek işe yaramadı, bunun yerine map panes
// kullanılması öneriyor fakat şimdilik uğraşmadım.
wmsLayer.setZIndex(2);
megsisLayer.setZIndex(3);
drawnItems.setZIndex(4);

// ==========================
// LAYER CONTROL
// ==========================

const baseMaps = {
    "Open Street Map": osm,
    "Uydu Görüntüsü": satellite
};

// Başlangıçta sunulacak ek katmanlar
const overlayMaps = {
    "TAKPAS Kadastro Harita Servisi": wmsLayer,
    "TAKPAS Kadastro Parsel Servisi": megsisLayer
    // placeholder
};

const layerControl = L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
}).addTo(map);

// Harita kontrollerini yerelleştirmeye yönelik DOM manipülasyonları
setTimeout(() => {

    const polygonBtn = document.querySelector('.leaflet-draw-draw-polygon');
    if (polygonBtn) {
        polygonBtn.title = "Poligon çizerek parsel sorgula";
    }

    const polygonSpan = document.querySelector('.leaflet-draw-draw-polygon .sr-only');
    if (polygonSpan) {
        polygonSpan.textContent = "Poligon çizerek parsel sorgula";
    }

    const markerBtn = document.querySelector('.leaflet-draw-draw-marker');
    if (markerBtn) {
        markerBtn.title = "Haritaya tıklayarak parsel sorgula";
    }

    const markerSpan = document.querySelector('.leaflet-draw-draw-marker .sr-only');
    if (markerSpan) {
        markerSpan.textContent = "Haritaya tıklayarak parsel sorgula";
    }

    // const deleteBtn = document.querySelector('.leaflet-draw-edit-remove');
    // if (deleteBtn) {
    //     deleteBtn.title = "Silinecek obje yok"
    // }

}, 300);

function updateLayerControlTitles() {

    const base = document.querySelector('.leaflet-control-layers-base');
    const overlay = document.querySelector('.leaflet-control-layers-overlays');

    const container = layerControl.getContainer();

    if (!container.querySelector('.custom-parent-title')) {
        const title = document.createElement('div');
        title.innerText = "Katman Yöneticisi";
        title.className = "custom-parent-title";
        title.style.fontWeight = "bold";
        title.style.marginBottom = "5px";
        title.style.textAlign = "center";
        title.style.fontSize = "14px";
        title.style.backgroundColor = "gray";
        title.style.color = "white";

        const separator = document.createElement('div');
        separator.classList.add("leaflet-control-layers-separator");

        container.prepend(separator);
        container.prepend(title); // üstte görünmesi için
    }

    if (base && !base.querySelector('.custom-base-title')) {
        const title = document.createElement('div');
        title.innerText = "Altlık harita seçeneği:";
        title.className = "custom-base-title";
        title.style.fontWeight = "bold";
        base.prepend(title);
    }

    if (overlay && !overlay.querySelector('.custom-overlay-title')) {
        const title = document.createElement('div');
        title.innerText = "TAKPAS servisleri:";
        title.className = "custom-overlay-title";
        title.style.fontWeight = "bold";
        overlay.prepend(title);
    }
}

// DOM elemanları güncellenecek olursa gerçekleştirdiğimiz yerelleştirme
// ayarları kaybolmasın diye bu komutları yeniden çağıralım.
map.on('layeradd', updateLayerControlTitles);
map.on('layerremove', updateLayerControlTitles);
// sayfa ilk ready state'e geldikten 100ms sonra fonksiyonu çağıralım
setTimeout(updateLayerControlTitles, 100);

// İşlemler sırasında 'Yükleniyor...' ekranı sunmak için gerekli kodlar:
let loaderStartTime = 0;
const MIN_LOADER_TIME = 1500; // ms (1.5 sn)

function showLoader(msg = "Yükleniyor...") {
    const loader = document.getElementById("mapLoader");
    loader.querySelector("span").textContent = msg;

    loader.classList.remove("hidden");
    loaderStartTime = Date.now();

}

function updateLoader (msg = "...") {
    const loader = document.getElementById("mapLoader");
    loader.querySelector("span").textContent = msg;
}

function hideLoader() {
    const loader = document.getElementById("mapLoader");

    const elapsed = Date.now() - loaderStartTime;
    const remaining = MIN_LOADER_TIME - elapsed;

    if (remaining > 0) {
        setTimeout(() => {
            loader.classList.add("hidden");
        }, remaining);
    } else {
        loader.classList.add("hidden");
    }
}

// ==========================
// WMS (PNG) LAZY LOAD
// ==========================

// Elimizdeki örnek veri bu sınırları kapsıyor.
// let panBounds = [[37.815387790011158, 27.293377767543369], [37.853381361024738, 27.33093894305452]];
let panBounds = [[37.7892, 27.2360], [37.8644, 27.3418]]; // biraz daha geniş bir çerçeve...
map.setMaxBounds(panBounds);
map.setMinZoom(14);
// const outer = [
//     [85, -180],
//     [85, 180],
//     [-85, 180],
//     [-85, -180]
// ];

// const hole = [
//     [37.856, 27.291],
//     [37.813, 27.291],
//     [37.813, 27.332],
//     [37.856, 27.332]
// ];

// L.polygon([outer, hole], {
//     color: "#b52323",
//     weight: 1,
//     fillColor: "#000",
//     fillOpacity: 0.5
// }).addTo(map);

map.on('overlayadd', async function (e) {

    if (e.name === "TAKPAS Kadastro Harita Servisi") {
        
        showLoader("Kadastro Harita Katmanı Yükleniyor ... ")

        try {
            const bounds = await getImageBounds(
            "data/images/wms-turkmen-zengin-gorsel.pgw",
            "data/images/wms-turkmen-zengin-gorsel.png"
        );

        const image = L.imageOverlay(
            "data/images/wms-turkmen-zengin-gorsel.png",
            bounds,
            { opacity: 1 }
        );
        wmsLayer.clearLayers();
        wmsLayer.addLayer(image);

        image.on("load", () => {
            hideLoader()
        });
        } catch (err) {
            console.error(err);
            hideLoader(); // hata durumunda da kapat
        } 
    }
    // Harita gezinmesini kısıtla
    map.panInsideBounds(bounds, {
        duration: 3
    });
});

// TAKPAS MEGSİS katmanları kapatıldığında yeniden serbest gezinme ayarı,

map.on('overlayremove', function (e) {
     if (e.name === "TAKPAS-MEGSİS Kadastro WMS") {
         // Harita gezinmesini serbest bırak
         map.setMaxBounds([[-90, 0], [90, 360]])
         map.setMinZoom(0)
     }
})

// ==========================
// HARİTADAN WFS QUERY
// ==========================

let foundParcels = new Map();
// Bulunan parselleri KeyID özniteliği ile bir Map içinde kayıt ederek
// mükerrer ekleme işlemini engelle ve listeleme için hazırla.

// Görselleştirme araçlarının CPU bound işlemler ile uyumlu akışı için
// bu şekilde bir gecikme işlemi tanımlandı ...
function delay(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Tarayıcı ekran çizin döngsünü el ile tetiklemek için bu fonksiyon kullanılır
// bu sayede CPU bound işlemin belli olaylardan sonra başlamasını garanti altına 
// alabiliriz
function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

map.on(L.Draw.Event.CREATED, async function (e) {

    const layer = e.layer; // Çizilen detay nesnesine referanslıdır (Marker ya da polygon).

    let foundParcelCount = 0;
    const foundFeatures = [];

    console.log("Sorgu geometrisi:", layer.toGeoJSON());

    showLoader("Sorgu geometrisine isabet eden parseller aranıyor ...")
    // Loader'ımızın render süreci düzgünce çalışabilsin diye gecikme çağıralım:
    await delay(50);

    if (layer instanceof L.Marker) {

        const latlng = layer.getLatLng();
        const point = turf.point([latlng.lng, latlng.lat]);

        geojsonData.features.forEach(feature => {

            if (turf.booleanPointInPolygon(point, feature)) {

                // Mükerrer çizimi önlemek için:
                const parcelKey = feature.properties.KeyID;
                if (foundParcels.has(parcelKey)) {
                    drawnItems.removeLayer(layer);
                    return;
                }

                foundFeatures.push(feature);
                foundParcels.set(parcelKey, feature);
                foundParcelCount++;

                const centroid = turf.centroid(feature);
                const [lng, lat] = centroid.geometry.coordinates;

                // MARKER'I TAŞI
                layer.setLatLng([lat, lng]);

                //Marker'a pop up ekleme
                layer.bindPopup(`
                    ${feature.properties.Name}
                `);
            }

        });
    } else if (e.layerType === "polygon") {
        const drawnGeoJSON = layer.toGeoJSON();

        for (const feature of geojsonData.features) {

            if (turf.booleanIntersects(drawnGeoJSON, feature)) {

                // Mükerrer çizimi önlemek için:
                // Poligon ile sorgulama durumunda her parsel tek tek
                // incelenmeli o yüzden return yerine continue kullandık
                const parcelKey = feature.properties.KeyID;
                if (foundParcels.has(parcelKey)) continue;

                foundParcels.set(parcelKey, feature);
                foundParcelCount++;

                foundFeatures.push(feature);
                addToPageList(feature);

                // Çizdirme komutu
                // drawParcel(feature);
            }
        }
        console.log("Arama alanı ilen keşisen parsel sayısı:", foundParcelCount);
    }
    if (foundParcelCount) {
        drawnItems.addLayer(layer);
    } else if (layer instanceof L.Marker) {
        alert("Arama yapılan noktada tescilli taşınmaz bulunamadı...");
    } else if (layer instanceof L.Polygon) {
        alert("Arama yapılan alanda tescilli taşınmaz bulunamadı...");
    }
    
    hideLoader();
    // Bulunan parsellerin görselleştirmesi loader UI elemanının kapanması sonrasında gerçekleşsin...
    await nextFrame();
    setTimeout(() => {
        foundFeatures.forEach(feat => {
            addToPageList(feat);
            drawParcel(feat);
    });
    }, 1500);
});

// ==========================
// Bulunan parselleri ekrana çizdirme
// ==========================
function drawParcel(feature) {

    const props = feature.properties;
    console.log("Bulunan parsel:", props);

    megsisLayer.addData(feature);
}

// ==========================
// PGW → BOUNDS HESAPLAMA
// ==========================

async function getImageBounds(pgwUrl, imageUrl) {

    const text = await fetch(pgwUrl).then(r => r.text());
    const lines = text.trim().split(/\r?\n/).map(Number);

    const pixelWidth = lines[0];
    const pixelHeight = lines[3];
    const topLeftX = lines[4];
    const topLeftY = lines[5];

    const img = new Image();

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
    });

    const width = img.width;
    const height = img.height;

    const minLng = topLeftX;
    const maxLat = topLeftY;

    const maxLng = minLng + (pixelWidth * width);
    const minLat = maxLat + (pixelHeight * height);

    return [
        [minLat, minLng],
        [maxLat, maxLng]
    ];
}

// Bulunan parselleri parsel listesine ekleme
// let hiddenResultElements = document.querySelectorAll(".hidden");
function addToPageList(feature) {

    // İlgili DOM bölümünün gösterimi kapalıysa aç
    // if (hiddenResultElements.length > 0) {
    //     hiddenResultElements.forEach( el => el.classList.remove("hidden"));
    //     hiddenResultElements = document.querySelectorAll(".hidden");
    // }

    const resultArea = document.querySelector("#resultArea");
    if (!("active" in resultArea.classList)) {
        resultArea.classList.add("active")
    }

    // const resultElements = document.querySelector("#resultsPane");
    // //parcelList.style; // Sadece inline stil tanımlarını döndürür...

    // // CSS ile tanımlanan stili sorgulamak için:
    // if (getComputedStyle(resultsPane).visibility === "hidden") {
    //     console.log("Sonuç sekmesi açılıyor...");
    //     resultsPane.style.visibility = "visible";
    // }

    // feature attributes
    const props = feature.properties;
    const key = props.KeyID;

    // Yüzölçüm değerini kolay okunabilsin diye formatla
    // Örnek veride yüzölçüm değerleri zaten sayı veri yapısında
    const formatted = new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(props.Yuzolcum);

    // DOM manipulation
    const tbody = document.querySelector("#parcelTable tbody");
    const row = document.createElement("tr");

    row.innerHTML = `
    <td class="featElem" data-value=${props.KeyID}>${props.Name}</td>
    <td>${props.Cins}</td>
    <td>${formatted}</td>
    `;

    row.addEventListener("click", onResultRowClick);

    tbody.appendChild(row);
}

// .queryTapu button click() event...
async function addTapuInfo(e) {

    showLoader("Ekranda yer alan taşınmazlara dair tapu bilgileri sorgulanıyor ...");
    await delay(1000);
    await nextFrame();

    const ciziliParselSayisi = megsisLayer.getLayers().length;
    console.log(`Ekrana çizili parsel sayısı: ${ciziliParselSayisi}`);

    // Bilgilerin listeleneceği tablo
    const tbody = document.querySelector("#tapuTable tbody");

    // Mükerrer listeleme yapılmasın diye mevcut KeyID'leri al
    const presentKIDs = Array.from(
        tbody.querySelectorAll("tr td:first-child")
    ).map(cell => cell.dataset.value);
    console.log("Tapu tablosunda mevcut KeyID'ler: ", presentKIDs);

    updateLoader("Tapu bilgilerinde yer alan kişisel veriler maskeleniyor ...");
    await delay(1000);
    await nextFrame();

    // 1 - parselleri tek tek işle,
    // megsisLayer'de yer alan featureler tapu bilgilerine göre yeniden stillendirilecek
    megsisLayer.eachLayer(layer => {
        // Bu döngüde "layer" değişkeni ekranda çizilmiş her bir tekil geometriye referanslıdır.
        // layer.feature ise _feature gizli özelliğinde tutulmakta olan orjinal geojson tanımına referanslıdır.
        // örnek kullanım: layer.setStyle({color: 'orange'});

        const props = layer.feature.properties;

        console.log("megsisLayer parsel KeyID: ", props.KeyID);

        if (presentKIDs.includes(props.KeyID.toString())) {
            console.log('Bu parsel listede zaten var...')
            return
        };

        if (props.Cins == 'Orman') {
            layer.setStyle({
                fillColor: 'darkgreen',
                fillOpacity: 0.6,
                dashArray: '1',
                color: "blue",
                weight: 3
            })

            layer.setTooltipContent(`
                Orman<br>
                ${props.Name}
                `);
        }

        if (props.Cins == 'Tarla') {
            layer.setStyle({
                fillColor: 'Khaki',
                fillOpacity: 0.3,
            })
        }

        if (props.Malik == 'Maliye Hazinesi') {
            // Kamu mülkü parsellerin kenarları mavi olsun
            layer.setStyle({
                dashArray: '1',
                color: "blue",
                weight: 3
            })

            layer.setTooltipContent(`
                Kamu Mülkü<br>
                ${props.Name}
                `);
        } else {

            // Kamu mülkü olmayan parsellerin kenarları farklı renk olsun
            layer.setStyle({
                dashArray: '1',
                color: "magenta",
                weight: 2
            })
        }

        // 2 - Yüzölçüm değerini kolay okunabilsin diye formatla
        // Örnek veride yüzölçüm değerleri zaten sayı veri yapısında
        const formatted = new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(props.Yuzolcum);

        // 3 - Tablo için DOM elemanlarını oluştur
        const row = document.createElement("tr");

        row.innerHTML = `
        <td class="featElem" data-value=${props.KeyID}>${props.Name}</td>
        <td>${props.Cins}</td>
        <td>${formatted}</td>
        <td>${props.Malik}</td>
        <td>${props.SerhBeyanIrtıfak}</td>
        `

        // Satıra tıklandığında ilgili parsele zoom/pan yapılsın
        row.addEventListener("click", onResultRowClick);

        // 3 - Tabloya ekle
        tbody.appendChild(row);

    })

    updateLoader("Tematik görselleştirme uygulanıyor ...");
    // Görselleştirme uygulamak için şimdilik haritadan kaldıralım
    map.removeLayer(megsisLayer);
    await delay(800);
    await nextFrame();
    setTimeout(() => {
        megsisLayer.addTo(map);
        // foundParcels map nesnesi içerisindeki tapu bilgileri ekranda ilgili alana eklenecek

        // 4 - DOM elemanını animasyonu çalıştıracak şekilde göster
        const tapuBilgiAlanı = document.getElementById("tapuBilgiAlanı");

        if (!tapuBilgiAlanı.classList.contains("panel-open")) {
         tapuBilgiAlanı.classList.add("panel-open");
        }

        // 5 - Gösterim kontrolünü ekrana getir.
        legend.getContainer().classList.add("show")
    }, 100);
    hideLoader();
}

// Parsel sorgu sonuç tablosundaki satırlara tıklanıldığında
// çağırılan event
function onResultRowClick(e) {

    // e.target         : tıklanan td elemanı
    // e.currentTarget  : tıklanan tr elemanı
    const targetElement = e.currentTarget;
    // console.log("Satıra tıklandı: ",targetElement);

    const featElem = targetElement.querySelector(".featElem");
    const featName = featElem.innerText;
    const featKeyID = featElem.dataset.value;
    console.log("Zoom yapılacak parsel: ", featName, "ve KeyID: ", featKeyID);

    let queryVal = + featKeyID;
    let parcel = foundParcels.get(queryVal);
    // console.log("KeyID cinsi:",typeof(featKeyID))

    console.log("Parsel: ", parcel);
    // zoomToParcel fonksiyonunda fit bounds kullanılması
    // agresif bir kullanıcı deneyimi yaratabiliyor bu sebeple
    // panTo() metodunu deneyelim
    // zoomToParcel(parcel);
    flyToParcelBounds(parcel);
}

// Zoom ve pan bounds

function zoomToParcel(feature) {
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();

    map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16,
        duration: 2,
        animate: true
        });
}

function flyToParcelBounds(feature) {
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();

    map.flyToBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16
    })
}

// #clearParcels button click event
function clearParcels(e) {

    console.log("Sonuçlar temizleniyor...");

    // 1. haritadaki WFS katmanı temizle
    megsisLayer.clearLayers();

    // 2. layer map temizle
    foundParcels.clear();

    // 3. drawn items temizle
    drawnItems.clearLayers();

    // 4. tabloları temizle
    const tbody_1 = document.querySelector("#parcelTable tbody");
    if (tbody_1) tbody_1.innerHTML = "";

    const tbody_2 = document.querySelector("#tapuTable tbody");
    if (tbody_2) tbody_2.innerHTML = "";

    // 5. sonuçların gösterildiği DOM elemanlarını ilk haline getir
    const resultArea = document.querySelector("#resultArea");
    resultArea.classList.remove("active");

    const tapuBilgiAlanı = document.getElementById("tapuBilgiAlanı");
    if (tapuBilgiAlanı.classList.contains("panel-open")) {
        tapuBilgiAlanı.classList.remove("panel-open");
    }

    // 6. WFS katmanını kapat
    // if (map.hasLayer(megsisLayer)) {
    //     map.removeLayer(megsisLayer);
    // }

    // Katman kontrolünün özellestirilme fonk yeniden çağır:
    updateLayerControlTitles();

    // 7. Gösterim elemanını haritadan gönder
    legend.getContainer().classList.remove("show");
}

// #parselSorgula button click event
async function parselBul(e) {

    showLoader("Taşınmaz kadastro bilgi sisteminde aranıyor...");

    await loadGeoJSON();

    // const formContainer = e.target.closest(".form-group")
    const adaNo = document.querySelector("#Ada").value.trim()
    const parselNo = document.querySelector("#Parsel").value.trim()

    if (!adaNo || !parselNo) {
        alert("Lütfen ada ve parsel bilgilerini giriniz.")
    }
    const queryVal = `${adaNo}/${parselNo}`
    console.log("Sorgu elemanı: ", queryVal);

    let found = 0;
    // foundParcels nesnesini mükerrerlik için kontrol et:
    // Name özniteliği demo veri seti için unique nitelikte
    foundParcels.forEach((v, k) => {
        // console.log(`
        //     Önceden bulunan parseller kontrol ediliyor...
        //     ${k} : ${v} 
        //     `)
        if (v.properties.Name === queryVal) {
            console.log(`${queryVal} parsel zaten mevcut`);
            found = 1;
            zoomToParcel(v);
            alert("Parsel daha önce sorgulanarak bulunmuş, yeni sorgulama yapılmadı!");
        };
    });

    let parcel;

    // Mükerrer parsel durumu yok ise arama yapılır...
    if (!found) {
        geojsonData.features.forEach(feat => {
            if (feat.properties.Name === queryVal) {
                parcel = feat;
                foundParcels.set(feat.properties.KeyID, feat);
                found = 1;
            }
        });
    }

    // Yine de parsel bulunumazsa kullanıcıya bildirilir.
    if (!found) {
        alert(`${queryVal} Ada/Parsel numarası ile taşınmaz bulunamadı!`);
    }

    hideLoader();
    // Bulunan parsellerin görselleştirmesi loader UI elemanının kapanması sonrasında gerçekleşsin...
    if (parcel) {
        await nextFrame();
        setTimeout(() => {
            drawParcel(parcel);
            addToPageList(parcel);
            zoomToParcel(parcel);
    }, 1500);
    }
}

// Test cases - passed
async function runListTest(limit = 10) {

    // Rasgele parseller seç
    await geojsonData;
    const sliceIdxLim = geojsonData.features.length - limit;
    const sliceBegin = Math.floor(Math.random() * sliceIdxLim);

    const features = geojsonData.features.slice(sliceBegin, sliceBegin + limit);

    // Kadastro bilgilerini göster
    features.forEach(f => {
        addToPageList(f);
        drawParcel(f);
        foundParcels.set(f.properties.KeyID, f)
        map.addLayer(megsisLayer);
    });

    const bounds = L.featureGroup(megsisLayer.getLayers()).getBounds();

    map.fitBounds(bounds, {
        padding: [5, 5]
    });

    // Tapu Bilgilerini göster
    document.getElementById("queryTapu").click();
}

async function initTest() {
    await loadGeoJSON();   // veri hazır olana kadar bekle
    runListTest(8);
}

// window.addEventListener("load", initTest);

function addDrawLabels() {

    const polygonBtn = document.querySelector('.leaflet-draw-draw-polygon');
    const markerBtn = document.querySelector('.leaflet-draw-draw-marker');

    if (polygonBtn && !polygonBtn.nextElementSibling?.classList.contains("draw-label")) {

        const polyLabel = document.createElement("span");
        polyLabel.className = "draw-label";
        polyLabel.innerText = "Poligon çizerek parsel sorgula";

        polygonBtn.after(polyLabel);
    }

    if (markerBtn && !markerBtn.nextElementSibling?.classList.contains("draw-label")) {

        const markerLabel = document.createElement("span");
        markerLabel.className = "draw-label";
        markerLabel.innerText = "Nokta tıklayarak parsel sorgula";

        markerBtn.after(markerLabel);
    }
}

// Mevcut harita görünümüne ilişkin bilgiler sol altta gösterilsin...
const infoControl = L.Control.extend({
    onAdd: function (map) {
        const div = L.DomUtil.create('div', 'custom-info');

        function update() {
            const b = map.getBounds();

            div.innerHTML = `
                <b>Harita Bilgisi</b><br>
                Zoom: ${map.getZoom()}<br>
                N: ${b.getNorth().toFixed(4)} |  E: ${b.getEast().toFixed(4)}<br>
                S: ${b.getSouth().toFixed(4)}  | W: ${b.getWest().toFixed(4)}        
            `;
        }

        update();

        map.on("zoomend moveend", update);

        return div;
    }
});

map.addControl(new infoControl({ position: "bottomleft" }));

// Draw kontrolleri yanına kendi etiketlerimizi eklemek için...
map.whenReady(addDrawLabels);

// Tapu stillerini gösterir lejant
const legend = L.control({ position: "bottomright" });

legend.onAdd = function (map) {
    const div = L.DomUtil.create("div", "legend");

    div.innerHTML = `
        <h4>Gösterim</h4>
        <div class="leaflet-control-layers-separator"></div>
        <h5>Taşınmaz Cinsi</h5>
        <div><span class="box orman"></span> Orman</div>
        <div><span class="box tarla"></span> Tarla</div>
        <div class="leaflet-control-layers-separator"></div>
        <h5>Mülkiyet Sınıfı</h5>
        <div><span class="box kamu"></span> Kamu mülkü</div>
        <div><span class="box ozel"></span> Özel mülk</div>
    `;

    return div;
};

legend.addTo(map);

// Bulunan parselleri indir...
function downloadResults(e) {

    const data = megsisLayer.toGeoJSON();
    const parselSayi = megsisLayer.getLayers().length;

    if (!data.features || data.features.length === 0) {
        alert("İndirilecek parsel yok");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `parseller-${parselSayi}_adet-GoogleEarth-ile-acabilirsiniz.geojson`;
    a.click();

    URL.revokeObjectURL(url);
}

// Başlangıç durumu:
async function pageInit () {
    showLoader("Demo kurulumu yapılıyor ...");
    await delay(50);
    await nextFrame();
    await geojsonData;

    const initParcel = '370/13';

    setTimeout(() => {
        // Kadastro haritası açık olsun ...
        wmsLayer.addTo(map);


        // 370/13 parsel numaralı taşınmaz sorgulanmış ve ekrana çizilmiş olsun ...
        geojsonData.features.forEach(feature => {

            const props = feature.properties;

            if (props.Name === initParcel)
            {
                drawParcel(feature);
                foundParcels.set(props.KeyID, feature);
                addToPageList(feature);
                
            }
        });

    }, 1000);

    hideLoader();
}

window.addEventListener("load", pageInit());