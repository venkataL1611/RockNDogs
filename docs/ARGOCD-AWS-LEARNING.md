# 🚀 ArgoCD & AWS Learning Guide (Free)

Complete hands-on guide to learn ArgoCD and AWS services without spending money.

---

## 🎯 Learning Path Overview

```
Local Kubernetes → ArgoCD → AWS Free Tier → Real Deployment
   (Week 1)        (Week 2)    (Week 3)       (Week 4)
```

---

## 📚 Week 1: Local Kubernetes Setup

### Prerequisites

```bash
# Install Docker Desktop (required)
# Download from: https://www.docker.com/products/docker-desktop

# Verify Docker is running
docker --version
docker ps
```

### Install Local Kubernetes

**Option 1: Kind (Recommended for learning)**

```bash
# macOS
brew install kind

# Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create cluster
kind create cluster --name learning

# Verify
kubectl cluster-info --context kind-learning
kubectl get nodes
```

**Option 2: Minikube**

```bash
# macOS
brew install minikube

# Start
minikube start --memory=4096 --cpus=2

# Verify
kubectl get nodes
minikube status
```

### Basic Kubernetes Commands

```bash
# Get cluster info
kubectl cluster-info
kubectl get nodes

# Create a simple deployment
kubectl create deployment nginx --image=nginx
kubectl get deployments
kubectl get pods

# Expose deployment
kubectl expose deployment nginx --port=80 --type=NodePort
kubectl get services

# Access in browser (Kind)
kubectl port-forward svc/nginx 8080:80
open http://localhost:8080

# Clean up
kubectl delete deployment nginx
kubectl delete service nginx
```

### Practice Tasks

1. Deploy RockNDogs dependencies:
   ```bash
   cd /Users/raviteja/Downloads/RockNDogs
   
   # Create namespace
   kubectl apply -f k8s/namespace.yaml
   
   # Deploy MongoDB
   kubectl apply -f k8s/mongodb.yaml
   
   # Deploy Elasticsearch
   kubectl apply -f k8s/elasticsearch.yaml
   
   # Deploy Redis
   kubectl apply -f k8s/redis.yaml
   
   # Check pods
   kubectl get pods -n rocknDogs
   kubectl logs -f <pod-name> -n rocknDogs
   ```

2. Build and load Docker image into Kind:
   ```bash
   # Build image
   docker build -t rocknDogs:latest .
   
   # Load into Kind
   kind load docker-image rocknDogs:latest --name learning
   
   # Deploy app
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/deployment.yaml
   
   # Check deployment
   kubectl get pods -n rocknDogs
   
   # Access app
   kubectl port-forward -n rocknDogs svc/rocknDogs-service 8080:80
   open http://localhost:8080
   ```

---

## 📚 Week 2: ArgoCD Hands-On

### Install ArgoCD

```bash
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready (takes 2-3 minutes)
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo

# Port-forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open in browser
open https://localhost:8080
# Username: admin
# Password: (from previous command)
```

### Deploy RockNDogs with ArgoCD

**Method 1: Using UI**

1. Login to ArgoCD at https://localhost:8080
2. Click "New App"
3. Fill in:
   - **Application Name**: rocknDogs
   - **Project**: default
   - **Sync Policy**: Automatic
   - **Repository URL**: https://github.com/venkataL1611/RockNDogs
   - **Path**: k8s
   - **Cluster URL**: https://kubernetes.default.svc
   - **Namespace**: rocknDogs
4. Click "Create"
5. Watch the sync happen!

**Method 2: Using CLI**

```bash
# Install ArgoCD CLI
brew install argocd  # macOS

# Or download binary
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-darwin-amd64
chmod +x argocd
sudo mv argocd /usr/local/bin/

# Login
argocd login localhost:8080 --insecure
# Username: admin
# Password: (from earlier)

# Create application
argocd app create rocknDogs \
  --repo https://github.com/venkataL1611/RockNDogs.git \
  --path k8s \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace rocknDogs \
  --sync-policy automated \
  --auto-prune \
  --self-heal

# Watch deployment
argocd app get rocknDogs
argocd app sync rocknDogs
argocd app wait rocknDogs
```

### ArgoCD Practice Tasks

1. **Make a change and watch auto-sync:**
   ```bash
   # Edit k8s/deployment.yaml - change replicas from 2 to 3
   git add k8s/deployment.yaml
   git commit -m "Scale to 3 replicas"
   git push
   
   # Watch ArgoCD auto-detect and sync
   argocd app watch rocknDogs
   ```

2. **Simulate rollback:**
   ```bash
   # Check history
   argocd app history rocknDogs
   
   # Rollback to previous version
   argocd app rollback rocknDogs <revision-number>
   ```

3. **View differences:**
   ```bash
   # See what ArgoCD wants to sync
   argocd app diff rocknDogs
   ```

---

## 📚 Week 3: AWS Free Tier Setup

### Sign Up for AWS Free Tier

1. Go to https://aws.amazon.com/free/
2. Create account (needs credit card, but won't charge within limits)
3. **IMPORTANT:** Set up billing alerts immediately!

### Set Up Billing Alerts

```bash
# In AWS Console:
1. Go to Billing Dashboard
2. Billing Preferences → Enable:
   - "Receive Free Tier Usage Alerts"
   - "Receive Billing Alerts"
3. CloudWatch → Alarms → Create Alarm
   - Metric: EstimatedCharges
   - Condition: Greater than $1
   - Action: Email notification
```

### Free Tier Resources for Learning

| Service | Free Tier | Perfect For |
|---------|-----------|-------------|
| **EC2** | 750 hrs/month (t2.micro) | Run Kubernetes node |
| **RDS** | 750 hrs/month (db.t2.micro) | PostgreSQL/MySQL |
| **S3** | 5 GB storage | Static files, backups |
| **Lambda** | 1M requests/month | Serverless functions |
| **CloudWatch** | 10 metrics | Monitoring |
| **ELB** | 750 hrs/month | Load balancer |

### AWS Practice Tasks

**Task 1: Launch EC2 Instance**

```bash
# 1. AWS Console → EC2 → Launch Instance
# 2. Choose:
#    - Name: learning-k8s
#    - AMI: Ubuntu 22.04 LTS (Free tier eligible)
#    - Instance type: t2.micro
#    - Key pair: Create new (download .pem file)
#    - Network: Default VPC
#    - Storage: 8 GB (free tier)
# 3. Launch

# 4. Connect via SSH
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<public-ip>

# 5. Install Docker
sudo apt update
sudo apt install -y docker.io
sudo usermod -aG docker ubuntu

# 6. IMPORTANT: Stop when not using!
# AWS Console → EC2 → Stop Instance
```

**Task 2: Deploy RockNDogs on EC2**

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<public-ip>

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone your repo
git clone https://github.com/venkataL1611/RockNDogs.git
cd RockNDogs

# Run with docker-compose
docker-compose up -d

# Access app
# Open security group port 3000 in EC2 console
# Visit: http://<ec2-public-ip>:3000
```

**Task 3: Use S3 for Static Files**

```bash
# AWS Console → S3 → Create Bucket
# Name: rocknDogs-static-assets
# Region: us-east-1
# Uncheck "Block all public access" (for learning)

# Upload files via CLI
aws configure  # Enter your credentials
aws s3 cp public/stylesheets/ s3://rocknDogs-static-assets/css/ --recursive
aws s3 ls s3://rocknDogs-static-assets/
```

---

## 📚 Week 4: EKS + ArgoCD (Advanced)

### Launch EKS Cluster (Free Control Plane)

**⚠️ Warning: Worker nodes are NOT free tier!**
Use spot instances or small t3.micro to minimize costs.

```bash
# Install eksctl
brew install eksctl

# Create cluster (USE CAREFULLY - costs $ for nodes)
eksctl create cluster \
  --name learning-eks \
  --region us-east-1 \
  --node-type t3.micro \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 2 \
  --managed

# This takes 15-20 minutes

# Verify
kubectl get nodes

# IMPORTANT: Delete when done!
# eksctl delete cluster --name learning-eks --region us-east-1
```

### Deploy RockNDogs to EKS with ArgoCD

```bash
# 1. Install ArgoCD on EKS
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2. Expose ArgoCD (for learning, use LoadBalancer)
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# 3. Get URL (takes 2-3 minutes for ELB to provision)
kubectl get svc argocd-server -n argocd

# 4. Get password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# 5. Login to ArgoCD and deploy RockNDogs
# (same steps as Week 2)

# 6. Access app via LoadBalancer
kubectl get svc -n rocknDogs
# Visit the EXTERNAL-IP
```

---

## 💰 Cost Management Tips

### Stay Within Free Tier

```bash
# Check your usage
AWS Console → Billing → Free Tier

# Set up Cost Explorer
AWS Console → Cost Management → Cost Explorer

# Use AWS CLI to audit
aws ce get-cost-forecast \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --metric UNBLENDED_COST \
  --granularity MONTHLY
```

### Shutdown Checklist

**Every time you finish practicing:**

```bash
# Local Kubernetes (free, but uses laptop resources)
kind delete cluster --name learning
# or
minikube stop

# AWS EC2
# AWS Console → EC2 → Stop Instance (DON'T just close terminal!)

# AWS EKS (EXPENSIVE if left running!)
eksctl delete cluster --name learning-eks --region us-east-1

# Verify nothing is running
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name]'
```

---

## 📖 Learning Resources (Free)

### ArgoCD

- **Official Docs**: https://argo-cd.readthedocs.io/
- **YouTube Playlist**: "ArgoCD Tutorial" by TechWorld with Nana
- **Hands-on Lab**: https://killercoda.com/argoproj (free interactive environment)

### AWS

- **AWS Skill Builder**: https://skillbuilder.aws/ (free courses)
- **AWS Free Tier FAQs**: https://aws.amazon.com/free/
- **freeCodeCamp AWS Course**: YouTube - "AWS Certified Cloud Practitioner" (12 hours)

### Kubernetes

- **Kubernetes by Example**: https://kubernetesbyexample.com/
- **Play with K8s**: https://labs.play-with-k8s.com/ (free browser environment)
- **Kubernetes The Hard Way**: https://github.com/kelseyhightower/kubernetes-the-hard-way

---

## 🎯 30-Day Learning Schedule

| Week | Focus | Practice |
|------|-------|----------|
| 1 | Local K8s | Deploy RockNDogs locally with Kind |
| 2 | ArgoCD | GitOps workflow, auto-sync, rollbacks |
| 3 | AWS Basics | EC2, S3, RDS within free tier |
| 4 | EKS + ArgoCD | Real cloud deployment (monitor costs!) |

---

## ⚠️ Important Warnings

1. **Always stop EC2 instances** when not using
2. **Set billing alarms** at $1, $5, $10
3. **Delete EKS clusters** immediately after learning ($$$ expensive)
4. **Use t2.micro/t3.micro** only
5. **Check billing dashboard** daily for first week

---

## 🎓 Next Steps After Free Learning

Once comfortable with basics:

1. **Get AWS Certified Cloud Practitioner** (entry-level cert)
2. **Contribute to open source** Kubernetes/ArgoCD projects
3. **Build side projects** using your new skills
4. **Apply for DevOps/SRE roles** with hands-on experience

---

**Happy Learning! 🚀**
