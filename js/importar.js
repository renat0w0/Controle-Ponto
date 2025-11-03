// importar.js - Lógica de importação de CSV

function processarCSVCatraca(conteudo) {
    const linhas = conteudo.split('\n');
    const registros = [];
    
    // Regex para capturar data e hora: DD/MM/YYYY HH:MM
    const regex = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/g;
    
    for (const linha of linhas) {
        let match;
        while ((match = regex.exec(linha)) !== null) {
            const [_, dia, mes, ano, hora, minuto] = match;
            const data = `${ano}-${mes}-${dia}`;
            const horaFormatada = `${hora}:${minuto}`;
            
            registros.push({
                data: data,
                hora: horaFormatada
            });
        }
    }
    
    return registros;
}

function importarCSV(conteudo) {
    const registrosNovos = processarCSVCatraca(conteudo);
    
    if (registrosNovos.length === 0) {
        alert('⚠️ Nenhum registro encontrado no arquivo!');
        return { importados: 0, duplicados: 0 };
    }
    
    // Agrupar registros por data (entrada/saída)
    const registrosAgrupados = agruparRegistrosPorData(registrosNovos);
    
    const registrosExistentes = carregarDados();
    let importados = 0;
    let duplicados = 0;
    
    registrosAgrupados.forEach(novoReg => {
        const existe = registrosExistentes.some(r => 
            r.data === novoReg.data && r.entrada === novoReg.entrada
        );
        
        if (!existe) {
            adicionarRegistro(novoReg);
            importados++;
        } else {
            duplicados++;
        }
    });
    
    return { importados, duplicados };
}

function configurarImportacao() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('csvFileInput');
    const resultDiv = document.getElementById('importResult');
    
    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--color-primary)';
        uploadArea.style.backgroundColor = 'var(--bg-secondary)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.backgroundColor = 'var(--bg-card)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.backgroundColor = 'var(--bg-card)';
        
        const file = e.dataTransfer.files[0];
        if (file) {
            processarArquivo(file);
        }
    });
    
    // File Input
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            processarArquivo(file);
        }
    });
    
    function processarArquivo(file) {
        if (!file.name.endsWith('.csv')) {
            alert('⚠️ Por favor, selecione um arquivo CSV!');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const resultado = importarCSV(e.target.result);
            
            document.getElementById('importCount').textContent = resultado.importados;
            document.getElementById('duplicateCount').textContent = resultado.duplicados;
            resultDiv.style.display = 'block';
            
            if (resultado.importados > 0) {
                alert(`✅ ${resultado.importados} registros importados com sucesso!`);
            }
        };
        reader.readAsText(file, 'UTF-8');
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    configurarImportacao();
});
