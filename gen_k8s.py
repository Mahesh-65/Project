import os

SERVICES = {
    "user-service": {
        "port": 4001,
        "image": "maheshnandi/gamesbond-user-service:v1.0.0",
        "env": {
            "PORT": "4001",
            "MONGO_URL": "mongodb://mongo:27017",
            "REDIS_URL": "redis://redis:6379"
        },
        "secrets": {
            "SESSION_SECRET": "sports_hub_secret_123",
            "JWT_SECRET": "sports_hub_jwt_secret_456"
        }
    },
    "player-service": {
        "port": 4002,
        "image": "maheshnandi/gamesbond-player-service:v1.0.0",
        "env": {
            "PORT": "4002",
            "MONGO_URL": "mongodb://mongo:27017",
            "REDIS_URL": "redis://redis:6379"
        },
        "secrets": {}
    },
    "team-service": {
        "port": 4003,
        "image": "maheshnandi/gamesbond-team-service:v1.0.0",
        "env": {
            "PORT": "4003",
            "MONGO_URL": "mongodb://mongo:27017"
        },
        "secrets": {}
    },
    "tournament-service": {
        "port": 4004,
        "image": "maheshnandi/gamesbond-tournament-service:v1.0.0",
        "env": {
            "PORT": "4004",
            "MONGO_URL": "mongodb://mongo:27017"
        },
        "secrets": {}
    },
    "ground-service": {
        "port": 4005,
        "image": "maheshnandi/gamesbond-ground-service:v1.0.0",
        "env": {
            "PORT": "4005",
            "MONGO_URL": "mongodb://mongo:27017"
        },
        "secrets": {}
    },
    "shop-service": {
        "port": 4006,
        "image": "maheshnandi/gamesbond-shop-service:v1.0.0",
        "env": {
            "PORT": "4006",
            "MONGO_URL": "mongodb://mongo:27017"
        },
        "secrets": {}
    },
    "admin-service": {
        "port": 4007,
        "image": "maheshnandi/gamesbond-admin-service:v1.0.0",
        "env": {
            "PORT": "4007",
            "MONGO_URL": "mongodb://mongo:27017"
        },
        "secrets": {}
    },
    "frontend": {
        "port": 3000,
        "image": "maheshnandi/gamesbond-frontend:v1.0.0",
        "env": {
            "NEXT_PUBLIC_API_URL": "http://localhost:4000",
            "NODE_ENV": "production"
        },
        "secrets": {}
    }
}

DATABASES = {
    "mongo": {
        "port": 27017,
        "image": "maheshnandi/mongo:7",
        "env": {},
        "secrets": {},
        "dir": "database/mongo"
    },
    "redis": {
        "port": 6379,
        "image": "maheshnandi/redis:7-alpine",
        "env": {},
        "secrets": {},
        "dir": "database/redis"
    }
}

DEPLOYMENT_TEMPLATE = """apiVersion: apps/v1
kind: Deployment
metadata:
  name: {name}
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: {name}
  template:
    metadata:
      labels:
        app: {name}
    spec:
      containers:
      - name: {name}
        image: {image}
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: {port}
        envFrom:
        - configMapRef:
            name: {name}-devconfig
        - secretRef:
            name: {name}-secret
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "300m"
            memory: "256Mi"
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
        readinessProbe:
          httpGet:
            path: {health_path}
            port: {port}
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: {health_path}
            port: {port}
          initialDelaySeconds: 15
          periodSeconds: 20
"""

STATEFULSET_TEMPLATE = """apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: {name}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {name}
  template:
    metadata:
      labels:
        app: {name}
    spec:
      containers:
      - name: {name}
        image: {image}
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: {port}
        envFrom:
        - configMapRef:
            name: {name}-devconfig
        - secretRef:
            name: {name}-secret
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "300m"
            memory: "256Mi"
        securityContext:
          runAsNonRoot: false
          allowPrivilegeEscalation: false
        readinessProbe:
          tcpSocket:
            port: {port}
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          tcpSocket:
            port: {port}
          initialDelaySeconds: 15
          periodSeconds: 20
"""

SERVICE_TEMPLATE = """apiVersion: v1
kind: Service
metadata:
  name: {name}
spec:
  type: ClusterIP
  selector:
    app: {name}
  ports:
    - port: {port}
      targetPort: {port}
"""

CONFIGMAP_TEMPLATE = """apiVersion: v1
kind: ConfigMap
metadata:
  name: {name}-{env}config
data:
{data}
"""

SECRET_TEMPLATE = """apiVersion: v1
kind: Secret
metadata:
  name: {name}-secret
type: Opaque
stringData:
{data}
"""

def generate_yaml(base_dir, is_statefulset, name, config):
    os.makedirs(base_dir, exist_ok=True)
    
    port = config["port"]
    image = config["image"]
    env = config["env"]
    secrets = config["secrets"]
    health_path = "/" if name == "frontend" else "/health"
    
    # Generate deployment/statefulset
    if is_statefulset:
        main_yaml = STATEFULSET_TEMPLATE.format(name=name, image=image, port=port)
        main_file = "statefulset.yaml"
    else:
        main_yaml = DEPLOYMENT_TEMPLATE.format(name=name, image=image, port=port, health_path=health_path)
        main_file = "deployment.yaml"
        
    with open(os.path.join(base_dir, main_file), "w") as f:
        f.write(main_yaml)
        
    # Generate service
    service_yaml = SERVICE_TEMPLATE.format(name=name, port=port)
    with open(os.path.join(base_dir, "service.yaml"), "w") as f:
        f.write(service_yaml)
        
    # Generate devconfig / prodconfig
    env_str = "\n".join([f'  {k}: "{v}"' for k, v in env.items()]) if env else "  {}"
    
    with open(os.path.join(base_dir, "devconfig.yaml"), "w") as f:
        f.write(CONFIGMAP_TEMPLATE.format(name=name, env="dev", data=env_str))
        
    with open(os.path.join(base_dir, "prodconfig.yaml"), "w") as f:
        f.write(CONFIGMAP_TEMPLATE.format(name=name, env="prod", data=env_str))
        
    # Generate secret
    sec_str = "\n".join([f'  {k}: "{v}"' for k, v in secrets.items()]) if secrets else "  {}"
    with open(os.path.join(base_dir, "secret.yaml"), "w") as f:
        f.write(SECRET_TEMPLATE.format(name=name, data=sec_str))

# Write files
for name, config in SERVICES.items():
    generate_yaml(f"{name}/k8s", False, name, config)

for name, config in DATABASES.items():
    generate_yaml(f"{config['dir']}/k8s", True, name, config)
    
print("Successfully generated k8s files")
