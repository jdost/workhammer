class nginx {
   $numprocs = 1
   $logdir = "/var/log/nginx"

   if $::osfamily == 'debian' {
      exec { 'update': command => "/usr/bin/apt-get update", }
   } else {
      exec { 'update': command => "echo hi", }
   }

   package { 'nginx': ensure => installed, require => Exec['update'], }

   file { 'nginx':
      path    => '/etc/nginx/nginx.conf',
      ensure  => present,
      content => template("nginx/nginx.conf.erb"),
      require => Package['nginx'],
   }

   service { 'nginx':
      ensure     => running,
      enable     => true,
      hasrestart => true,
      require    => File['nginx'],
   }
}
