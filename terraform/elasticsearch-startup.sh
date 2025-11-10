#!/bin/bash

# Update system
apt-get update
apt-get upgrade -y

# Install Java
apt-get install -y openjdk-11-jdk

# Install Elasticsearch
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -
echo "deb https://artifacts.elastic.co/packages/8.x/apt stable main" | tee /etc/apt/sources.list.d/elastic-8.x.list
apt-get update
apt-get install -y elasticsearch

# Configure Elasticsearch
cat > /etc/elasticsearch/elasticsearch.yml <<EOF
cluster.name: jewelry-cluster
node.name: node-1
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
xpack.security.enabled: false
EOF

# Start Elasticsearch
systemctl daemon-reload
systemctl enable elasticsearch
systemctl start elasticsearch
