$cluster = "learnquest-cluster"
$tasks = (aws ecs list-tasks --cluster $cluster --output json | ConvertFrom-Json).taskArns
foreach ($taskArn in $tasks) {
    $taskDetails = (aws ecs describe-tasks --cluster $cluster --tasks $taskArn --output json | ConvertFrom-Json).tasks[0]
    $eniId = ($taskDetails.attachments[0].details | Where-Object { $_.name -eq 'networkInterfaceId' }).value
    if ($eniId) {
        $ip = (aws ec2 describe-network-interfaces --network-interface-ids $eniId --output json | ConvertFrom-Json).NetworkInterfaces[0].Association.PublicIp
        Write-Output "Task: $taskArn"
        Write-Output "IP: $ip"
        Write-Output "----------------"
    }
}
