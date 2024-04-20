echo "Starting build and start process"
echo "Stoping the server"
sudo systemctl stop startlink
sleep 5

echo "Pulling latest changes from git"
git pull

echo "Removing .next folder"
rm -rf .next

echo "Installing dependencies"
npm i

echo "Running db push"
npx prisma db push

echo "Running prisma generate"
npx prisma generate

echo "Running build"
npm run build

echo "Starting the server"
sudo systemctl start startlink
