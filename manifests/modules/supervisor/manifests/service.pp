define supervisor::service (
   $command,
   $numprocs = 1,
   $user,
) {
   file { "supervisor-${name}":
      path    => "/etc/supervisor/conf.d/${name}.conf",
      ensure  => present,
      content => template("supervisor/service.conf.erb"),
      require => Package['supervisor'],
   }

   exec { "supervisor-update-${name}":
      command     => "/usr/bin/supervisorctl update",
      require     => File["supervisor-${name}"],
   }

   service { "supervisor-${name}":
      ensure   => running,
      provider => base,
      restart  => "/usr/bin/supervisorctl restart ${name}",
      start    => "/usr/bin/supervisorctl start ${name}",
      status   => "/usr/bin/supervisorctl status | awk '/^${name}[: ]/{print \$2}' | grep '^RUNNING$'",
      stop     => "/usr/bin/supervisorctl stop ${name}",
      require  => Exec["supervisor-update-${name}"],
   }
}
