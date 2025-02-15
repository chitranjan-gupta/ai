# ai

Install Anaconda on Ubuntu

Run Anaconda on Ubuntu

conda --version
const list jupyter # to list
conda install jupyter # to install
conda init # to initiate
conda activate base # to start environment
conda info --envs # to list environment
conda deactivate # to deactivate environment

conda install ipykernel
python -m ipykernel install --user --name base --display-name "Conda (base)"
conda install tensorflow


# ollama linux
```sh
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama run deepseek-r1:1.5b
```