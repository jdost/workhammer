$dev = $environment == "development"
$prod = $environment == "production"


if $::osfamily == 'Debian' {
   exec { 'update': command => "/usr/bin/apt-get update", }
} else {
   exec { 'update': command => "echo hi", }
}
# Install dependencies
include mongo
include nginx
include supervisor
# Python
package { 'python': ensure => installed, }
package { 'python-pip': ensure => installed, }

if $vagrant == 1 {
   file { "/opt/workhammer":
      ensure => link,
      target => "/vagrant",
   }
}
# Build environment
exec { 'dependencies':
   require => [ Package['python-pip'], File['/opt/workhammer'] ],
   command => "/usr/bin/pip install -r /opt/workhammer/requirements.txt",
}

user { 'workhammer':
   ensure  => present,
   home    => "/opt/workhammer",
   require => File['/opt/workhammer'],
}

supervisor::service { 'workhammer':
   command => "/opt/workhammer/bin/workhammer",
   user    => 'workhammer',
   require => User['workhammer'],
}

nginx::vhost { 'workhammer':
   folder          => '/opt/workhammer',
   port            => "5000",
   static_location => "/opt/workhammer/static/",
}

if $dev {
   include "admin"
   exec { 'dependencies-dev':
      require => [ Package['python-pip'], File['/opt/workhammer'] ],
      command => "/usr/bin/pip install -r /opt/workhammer/requirements.dev.txt",
   }
}
